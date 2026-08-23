import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { toast } from "sonner";
import { Button } from "./button";
import { Toaster } from "./sonner";

const meta = {
  title: "UI Kit/Toast",
  component: Toaster,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Sonner, restyled to the one deliberate inverse surface in the system — toasts stay " +
          "dark (`#1F1F23`) on the otherwise light-only product, so a confirmation never competes " +
          "with the page for attention. A `<Toaster />` is already mounted globally in Storybook, " +
          "so these buttons just call `toast()`.",
      },
    },
  },
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Kinds: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => toast("Sipariş kaydedildi")}>
        Default
      </Button>
      <Button variant="outline" onClick={() => toast.success("SP-1004 dikime taşındı")}>
        Success
      </Button>
      <Button variant="outline" onClick={() => toast.info("Üç sipariş termini geçti")}>
        Info
      </Button>
      <Button variant="outline" onClick={() => toast.warning("Kesim aşamasında yığılma var")}>
        Warning
      </Button>
      <Button variant="outline" onClick={() => toast.error("Sipariş kaydedilemedi")}>
        Error
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.promise(new Promise((resolve) => setTimeout(resolve, 1800)), {
            loading: "Kaydediliyor…",
            success: "Sipariş kaydedildi",
            error: "Kaydedilemedi",
          })
        }
      >
        Loading → Success
      </Button>
    </div>
  ),
};

export const WithDescriptionAndAction: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() =>
          toast.success("SP-1004 dikime taşındı", {
            description: "Kesimde 2 saat 40 dakika bekledi.",
          })
        }
      >
        Açıklamalı
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast("SP-1007 silindi", {
            action: { label: "Geri al", onClick: () => toast.success("Geri alındı") },
          })
        }
      >
        Geri alınabilir
      </Button>
    </div>
  ),
};
