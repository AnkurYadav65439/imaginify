import Header from '@/components/shared/Header'
import TransformationForm from '@/components/shared/TransformationForm';
import { transformationTypes } from '@/constants';
import { getImageById } from '@/lib/actions/image.actions'
import { getUserById } from '@/lib/actions/user.actions';
import { IImage } from '@/lib/database/models/image.model';
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import React from 'react'

const UpdateTransformationPage = async ({ params: { id } }: SearchParamProps) => {
    const { userId } = auth();
    const image: IImage = await getImageById(id);
    const transformation = transformationTypes[image.transformationType as TransformationTypeKey];

    if (!userId) {
        redirect('/sign-in');
    }

    const user = await getUserById(userId);

    return (
        <>
            <Header title={transformation.title} subtitle={transformation.subTitle} />

            <section className="mt-10">
                <TransformationForm
                    action='Update'
                    userId={user._id}
                    type={image.transformationType as TransformationTypeKey}
                    creditBalance={user.creditBalance}
                    data={image}
                    config={image.config}
                />
            </section>
        </>
    )
}

export default UpdateTransformationPage