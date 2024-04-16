"use client"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { navLinks } from "@/constants";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";


const MobileNav = () => {
    const pathname = usePathname();

    return (
        <header className="header">
            <Link href="/" className="flex items-center gap-2 md:py-2">
                <Image src="/assets/images/logo-text.svg" alt="logo" width={180} height={28}></Image>
            </Link>

            <nav className="flex gap-2">
                <SignedIn>
                    <UserButton afterSignOutUrl='/' />
                    <Sheet>
                        <SheetTrigger>
                            <Image
                                src="/assets/icons/menu.svg" alt="menu"
                                height={32}
                                width={32}
                            />
                        </SheetTrigger>
                        <SheetContent className="sheet-content sm:w-64">
                            <>
                                <Image
                                    src="/assets/images/logo-text.svg" alt="menu"
                                    width={152}
                                    height={23}
                                />

                                <ul className='header-nav_elements'>
                                    {navLinks.map((link) => {
                                        const isActive = link.route === pathname;

                                        return (
                                            <li key={link.route} className={`flex whitespace-nowrap text-dark-700 ${isActive && "gradient-text"}`}>
                                                <Link href={link.route} className='sidebar-link'>
                                                    <Image
                                                        src={link.icon}
                                                        alt="logo"
                                                        width={24}
                                                        height={24}
                                                    />
                                                    {link.label}
                                                </Link>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </>
                        </SheetContent>
                    </Sheet>
                </SignedIn>

                <SignedOut>
                    <Button asChild className='button bg-purple-gradient bg-cover'>
                        <Link href="/sign-in">Login</Link>
                    </Button>
                </SignedOut>
            </nav>
        </header>
    )
}

export default MobileNav