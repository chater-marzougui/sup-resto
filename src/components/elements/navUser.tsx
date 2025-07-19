"use client";

import { Languages, LoaderCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ExitIcon, MoonIcon, PersonIcon, SunIcon } from "@radix-ui/react-icons";
import i18n from "i18next";
import { useAuth } from "../auth/use-auth";
import { UseTheme } from "../providers/theme-provider";

const countryOptions = [
    {
        value: "france",
        name: "France",
        code: "fr",
        flagUrl: "/assets/flags/fr.webp",
        altText: "France Flag",
    },
    {
        value: "united-kingdom",
        name: "United Kingdom",
        code: "en",
        flagUrl: "/assets/flags/gb.webp",
        altText: "United Kingdom Flag",
    },
];

export function NavUser() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { theme, setTheme } = UseTheme();
    const { user: data } = useAuth();
    const handleLogout = (e: any) => {
        e.preventDefault();
        setIsLoading(true);
        router.push("/auth/logout");
    };
    const handleLanguageChange = (language: string) => {
        i18n.changeLanguage(language);
        localStorage.setItem("locale", language);
        window.location.reload();
    };
    return (
        <div className="flex items-center gap-2 cursor-pointer">    
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant={"ghost"}
                                size="lg"
                                className="flex h-9 w-9 items-center rounded-full p-0 hover:bg-transparent active:bg-transparent cursor-pointer"
                            >
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback className="rounded-lg bg-gray-300 text-accent-foreground dark:bg-gray-400">
                                        {data?.firstName[0]}
                                        {data?.lastName[0]}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                            side="bottom"
                            align="end"
                            sideOffset={4}
                        >
                            <DropdownMenuLabel className="p-0 font-normal">
                                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarFallback className="rounded-lg">
                                            {data?.firstName[0]}
                                            {data?.lastName[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">
                                            {data?.firstName} {data?.lastName}
                                        </span>
                                        <span className="truncate text-xs">{data?.email}</span>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                                    <div className="flex w-full justify-between">
                                        <span>Dark Mode</span>
                                        {theme === "light" ? (
                                            <MoonIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
                                        ) : (
                                            <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 dark:rotate-0 dark:scale-100" />
                                        )}
                                    </div>
                                </DropdownMenuItem>

                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger className="dark:hover:text-accent-foreground">
                                        Language
                                        <Languages className="ml-auto h-[1.2rem] w-[1.2rem]" />
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuPortal>
                                        <DropdownMenuSubContent>
                                            {countryOptions.map((country) => {
                                                return (
                                                    <DropdownMenuItem
                                                        key={country.code}
                                                        onClick={() => handleLanguageChange(country.code)}
                                                    >
                                                        <img
                                                            className="aspect-[3/2] w-auto rounded-sm border-[1px]"
                                                            src={country.flagUrl}
                                                            alt={country.altText}
                                                        />
                                                        {/* <div className="w-full rounded-sm border-[1px]">
                                                                                                                                                <Flag className="w-12 h-auto"/>
                                                                                                                                        </div> */}
                                                    </DropdownMenuItem>
                                                );
                                            })}
                                        </DropdownMenuSubContent>
                                    </DropdownMenuPortal>
                                </DropdownMenuSub>
                                <DropdownMenuItem>
                                    <div className="flex w-full justify-between">
                                        <span>Profile</span>
                                        <PersonIcon className="h-[1.2rem] w-[1.2rem]" />
                                    </div>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} disabled={isLoading}>
                                <div className="flex w-full justify-between">
                                    <span>Sign Out</span>
                                    {isLoading ? (
                                        <LoaderCircle className="h-[1.2rem] w-[1.2rem] animate-spin" />
                                    ) : (
                                        <ExitIcon className="h-[1.2rem] w-[1.2rem]" />
                                    )}
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>
        </div>
    );
}
