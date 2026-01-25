"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/auth/client";
import { Logout01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@turbo/ui/button";
import { Icon } from "@turbo/ui/icon";
import { toast } from "@turbo/ui/toast";

interface LogoutButtonProps {
  size?: "sm" | "default" | "lg";
  type?: "icon" | "text";
}

export const LogoutButton = ({
  size = "sm",
  type = "icon",
}: LogoutButtonProps) => {
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await authClient.signOut();

    if (error) {
      toast.error("Failed to logout");
      return;
    }

    toast.success("Logged out successfully");
    router.push("/login");
  };

  const btnSize = useMemo(() => {
    if (type === "icon" && size === "sm") return "icon-sm";
    if (type === "icon" && size === "default") return "icon";
    if (type === "icon" && size === "lg") return "icon-sm";
    return size;
  }, [type, size]);

  return (
    <Button variant="outline" size={btnSize} onClick={handleLogout}>
      {type === "icon" ? <Icon icon={Logout01Icon} /> : "Logout"}
    </Button>
  );
};
