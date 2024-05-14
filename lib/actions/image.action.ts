import { revalidatePath } from "next/cache";
import Image from "../database/models/image.model";
import User from "../database/models/user.model";
import { connectToDatabase } from "../database/mongoose";
import { handleError } from "../utils";
import { redirect } from "next/navigation";

import mongoose, { Mongoose } from 'mongoose';

const MONGODB_URL = process.env.MONGODB_URL || "mongodb+srv://ankutbeast12345:ankutbeast12345imaginify@cluster0.a8wdcox.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// const populateUser = (query: any) => query.populate({
//     path: 'author',
//     model: User,
//     select: '_id firstName lastName'
// })

export async function addImage({ image, userId, path }: AddImageParams) {
    try {
        console.log("just enter actions before connectToDatabse")
        await connectToDatabase();
        console.log("inside addImage , after connectToDatabse")

        const author = await User.findById(userId);

        console.log("uauthor is : ", author);

        if (!author) {
            throw new Error("User not found");
        }

        const newImage = await Image.create({ ...image, author: author._id });

        console.log("newImage inside addImage is:", newImage)

        revalidatePath(path);

        return JSON.parse(JSON.stringify(newImage));

    } catch (error) {
        handleError(error);
    }
}

export async function updateImage({ image, userId, path }: UpdateImageParams) {
    try {
        await connectToDatabase();

        const imageToUpdate = await Image.findById(image._id);

        if (!imageToUpdate || imageToUpdate.author.toHexString() !== userId) {
            throw new Error("Unauthorized or image not found");
        }

        const updatedImage = await Image.findByIdAndUpdate(imageToUpdate._id, image, { new: true });

        revalidatePath(path);

        return JSON.parse(JSON.stringify(updatedImage));

    } catch (error) {
        handleError(error);
    }
}

export async function deleteImage(imageId: string) {
    try {
        await connectToDatabase();

        await Image.findByIdAndDelete(imageId);

    } catch (error) {
        handleError(error);
    } finally {
        redirect("/");
    }
}

export async function getImageById(imageId: string) {
    try {
        await connectToDatabase();

        const image = await Image.findById(imageId).populate({
            path: 'author',
            model: User,
            select: '_id firstName lastName'
        });

        if (!image) {
            throw new Error("Image not found");
        }

        return JSON.parse(JSON.stringify(image));

    } catch (error) {
        handleError(error);
    }
}