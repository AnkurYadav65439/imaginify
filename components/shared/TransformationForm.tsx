"use client"
import React, { useEffect, useState, useTransition } from 'react'
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { aspectRatioOptions, creditFee, defaultValues, transformationTypes } from '@/constants'
import { CustomField } from './CustomField'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { AspectRatioKey, debounce, deepMergeObjects } from '@/lib/utils'
import MediaUploader from './MediaUploader'
import TransformedImage from './TransformedImage'
import { updateCredits } from '@/lib/actions/user.actions'
import { getCldImageUrl } from 'next-cloudinary'
import { useRouter } from 'next/navigation'
import { addImage, updateImage } from '@/lib/actions/image.actions'
import { InsufficientCreditsModal } from './InsufficientCreditsModal'

export const formSchema = z.object({
    title: z.string(),
    publicId: z.string(),
    aspectRatio: z.string().optional(),
    color: z.string().optional(),
    prompt: z.string().optional(),
})

const TransformationForm = ({ action, data = null, userId, type, creditBalance, config = null }: TransformationFormProps) => {

    //contains {} inlcude type, title, config of a particular transf. type
    const transformationType = transformationTypes[type];

    const [image, setImage] = useState(data);   //all info about the image
    const [transformationConfig, setTransformationCongif] = useState(config);
    //actually have combined of it(from props only) with newTransformation(just below)

    const [newTransformation, setNewTransformation] = useState<Transformations | null>(null);
    //informat. about transform. required  by user, or just assist to transformationConfig on apply transf.

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTransforming, setIsTransforming] = useState(false);
    const [isPending, startTransition] = useTransition();   //let update state without blocking ui

    const router = useRouter();

    const initialValues = data && action === 'Update' ? {
        title: data?.title,
        aspectRatio: data?.aspectRatio,
        color: data?.color,
        prompt: data?.prompt,
        publicId: data?.publicId,
    } : defaultValues

    // 1. Define your form.
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialValues
    });

    // 2. Define a submit handler.
    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);

        if (data || image) {
            const transformationURL = getCldImageUrl({
                width: image?.width,
                height: image?.height,
                src: image?.publicId,
                ...transformationConfig
            })

            const imageData = {
                title: values.title,
                publicId: image?.publicId,
                transformationType: type,
                width: image?.width,
                height: image?.height,
                config: transformationConfig,
                secureURL: image?.secureURL,
                transformationURL: transformationURL,
                aspectRatio: values.aspectRatio,
                prompt: values.prompt,
                color: values.color
            }

            if (action === 'Add') {
                try {
                    const newImage = await addImage({
                        image: imageData,
                        userId,
                        path: '/'
                    })

                    if (newImage) {
                        form.reset();
                        setImage(data);
                        router.push(`/transformations/${newImage._id}`)
                    }
                } catch (error) {
                    console.log(error);
                }
            }

            if (action === 'Update') {
                try {
                    const updatedImage = await updateImage({
                        image: {
                            ...imageData,
                            _id: data._id
                        },
                        userId,
                        path: `/transformations/${data._id}`
                    })

                    if (updatedImage) {
                        router.push(`/transformations/${updatedImage._id}`)
                    }
                } catch (error) {
                    console.log(error);
                }
            }
        }

        setIsSubmitting(false);
    }

    const onSelectFieldHandler = (value: string, onChangeField: (value: string) => void) => {
        const imageSize = aspectRatioOptions[value as AspectRatioKey]

        setImage((prevState: any) => ({
            ...prevState,
            aspectRatio: imageSize.aspectRatio,
            width: imageSize.width,
            height: imageSize.height
        }))

        setNewTransformation(transformationType.config);    //.congif is {} with necces. info like prompt ,to, restore, removeBackground
        return onChangeField(value);  //??
    }

    const onInputChangeHandler = (fieldName: string, value: string, type: string, onChangeField: (value: string) => void) => {
        debounce(() => {
            setNewTransformation((prevState: any) => ({
                ...prevState,
                [type]: {
                    ...prevState?.[type],
                    [fieldName === 'prompt' ? 'prompt' : 'to']: value
                }
            }))
        }, 1000)();

        return onChangeField(value);    //??
    }

    //TODO: update credit fee to something else(current -1) (trigger on apply transformation)
    const onTransformHandler = async () => {
        setIsTransforming(true);

        setTransformationCongif(
            deepMergeObjects(newTransformation, transformationConfig)
        )
        setNewTransformation(null);

        startTransition(async () => {
            await updateCredits(userId, creditFee);
        })
    }

    useEffect(() => {
        //as no extra options required by user to apply these transformations
        if (image && (type === "restore" || type === "removeBackground")) {
            console.log("useffect for restore and remove", transformationType.config)
            setNewTransformation(transformationType.config);
        }
    }, [image, type, transformationType.config]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {creditBalance < Math.abs(creditFee) && <InsufficientCreditsModal />}
                <CustomField
                    control={form.control}
                    name="title"
                    formLabel="Image Title"
                    className='w-full'
                    render={({ field }) => <Input {...field} className="input-field" />}
                />

                {type === 'fill' && (
                    <CustomField
                        control={form.control}
                        name="aspectRatio"
                        formLabel="Aspect Ratio"
                        className='w-full'
                        render={({ field }) =>
                            <Select onValueChange={(value) => onSelectFieldHandler(value, field.onChange)} value={field.value}>
                                <SelectTrigger className="select-field">
                                    <SelectValue placeholder="Select size" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.keys(aspectRatioOptions).map((key) => (
                                        <SelectItem key={key} value={key} className='select-item'>
                                            {aspectRatioOptions[key as AspectRatioKey].label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        }
                    />
                )}

                {(type === 'remove' || type === 'recolor') && (
                    <div className='prompt-field'>
                        <CustomField
                            control={form.control}
                            name="prompt"
                            formLabel={
                                type === 'remove' ? 'Object to remove' : 'Object to recolor'
                            }
                            className='w-full'
                            render={({ field }) => (
                                <Input
                                    value={field.value}
                                    className='input-field'
                                    onChange={(e) => onInputChangeHandler(
                                        'prompt',
                                        e.target.value,
                                        type,
                                        field.onChange
                                    )}
                                />
                            )}
                        />
                        {type === 'recolor' && (
                            <CustomField
                                control={form.control}
                                name="color"
                                formLabel="Replacement Color"
                                className='w-full'
                                render={({ field }) => (
                                    <Input
                                        value={field.value}
                                        className='input-field'
                                        onChange={(e) => onInputChangeHandler(
                                            'color',
                                            e.target.value,
                                            'recolor',
                                            field.onChange
                                        )}
                                    />
                                )}
                            />
                        )}
                    </div>
                )}

                {/* contains cldUploadWidget by cloudinary (inside MediaUploader comp.) */}
                <div className="media-uploader-field">
                    <CustomField
                        control={form.control}
                        name="publicId"
                        className='flex flex-col size-full'
                        render={({ field }) => (
                            <MediaUploader
                                onValueChange={field.onChange}
                                setImage={setImage}
                                publicId={field.value}
                                image={image}
                                type={type}
                            />
                        )}
                    />

                    <TransformedImage
                        image={image}
                        type={type}
                        title={form.getValues().title}
                        isTransforming={isTransforming}
                        setIsTransforming={setIsTransforming}
                        transformationConfig={transformationConfig}
                    />
                </div>

                <div className="flex flex-col gap-4">
                    <Button
                        type="button"
                        className='submit-button capitalize'
                        disabled={isTransforming || newTransformation === null}
                        onClick={onTransformHandler}
                    >
                        {isTransforming ? 'Transforming...' : 'Apply Transformation'}
                    </Button>

                    <Button
                        type="submit"
                        className='submit-button capitalize'
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Submitting...' : 'Save Image'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}

export default TransformationForm