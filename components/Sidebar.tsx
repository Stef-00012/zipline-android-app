import React, { type Dispatch, type SetStateAction, useEffect, useRef, useState } from "react";
import { Animated, View, Dimensions, Text, Pressable } from "react-native";
import { styles } from "@/styles/components/sidebar";
import { type RelativePathString, usePathname } from "expo-router"
import { getSettings } from "@/functions/zipline/settings";
import { getCurrentUser } from "@/functions/zipline/user";
import { type SidebarOption, sidebarOptions } from "@/constants/sidebar"
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router"

interface Props {
    open: boolean;
    paddingTop: number;
    setOpen: Dispatch<SetStateAction<boolean>>
}

export default function Sidebar({ open = false, paddingTop = 0, setOpen }: Props) {
    const router = useRouter()

    const [openStates, setOpenStates] = useState<Record<string, boolean>>({})
    
    const screenWidth = Dimensions.get("window").width;
    const translateX = useRef(new Animated.Value(-screenWidth)).current;
    
    const [invitesEnabled, setInvitesEnabled] = useState<boolean>(false)
    const [isAdmin, setIsAdmin] = useState<boolean>(false)
    
    useEffect(() => {
        (async () => {
            const settings = await getSettings()
            const user = await getCurrentUser()
            
            if (typeof user !== "string" && ["ADMIN", "SUPERADMIN"].includes(user.role)) setIsAdmin(true)
            if (typeof settings !== "string" && settings.invitesEnabled) setInvitesEnabled(true)
        })()
    })
    
    const pathname = usePathname()

    // biome-ignore lint/correctness/useExhaustiveDependencies:.
    useEffect(() => {
        Animated.timing(translateX, {
            toValue: open ? 0 : -screenWidth,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [open, screenWidth]);

    return (
        <Animated.View style={[
            styles.sidebar,
            {
                transform: [{
                    translateX
                }],
                width: screenWidth,
                paddingTop 
            }]}>
            <View>
                {sidebarOptions.map(renderSidebarOptions)}
            </View>
        </Animated.View>
    );

    function renderSidebarOptions(option: SidebarOption) {
        if (option.adminOnly && !isAdmin) return (
            <View key={option.route || option.name} />
        )

        if (option.invitesRoute && !invitesEnabled) return (
            <View key={option.route || option.name} />
        )

        if (option.type === "button") {
            const isActive = pathname === option.route;

            const route = option.route as RelativePathString

            return (
                <Pressable key={route} onPress={() => {
                    setOpen(false)

                    if (isActive) return;

                    router.replace(route)
                }} style={{
                    ...styles.sidebarOption,
                    ...(isActive && styles.sidebarOptionActive)
                }}>
                    <MaterialIcons name={option.icon} size={20} color={isActive ? styles.sidebarOptionTextActive.color : styles.sidebarOptionText.color} />
                    <Text style={{
                        ...styles.sidebarOptionText,
                        ...(isActive && styles.sidebarOptionTextActive)
                    }}>{option.name}</Text>
                </Pressable>
            )
        }
        
        if (option.type === "select") {
            const open = openStates[option.name] ?? false

            return (
                <View key={option.name}>
                    <Pressable onPress={() => setOpenStates((prev) => {
                        return {
                            ...prev,
                            [option.name]: !prev[option.name]
                        }
                    })} style={styles.sidebarOption}>
                        <MaterialIcons name={option.icon} size={20} color={styles.sidebarOptionText.color} />
                        <Text style={styles.sidebarOptionText}>{option.name}</Text>
                        <MaterialIcons name={open ? "expand-more" : "expand-less"} size={20} color={styles.sidebarOptionText.color} />
                    </Pressable>
                    {open && (
                        <View style={{ paddingLeft: 20 }}>
                            {option.subMenus.map(renderSidebarOptions)}
                        </View>
                    )}
                </View>
            );
        }
    }
}