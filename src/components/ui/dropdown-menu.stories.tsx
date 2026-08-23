import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";

const meta = {
  title: "UI Kit/Dropdown Menu",
  component: DropdownMenu,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Row actions, filters and the account menu. A trigger button carries `aria-haspopup`, " +
          "which suppresses Button's press-nudge — the menu opening is the feedback instead.",
      },
    },
  },
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RowActions: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Sipariş işlemleri">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem>
          <Pencil />
          Düzenle
        </DropdownMenuItem>
        <DropdownMenuItem>
          Kopyala
          <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <Trash2 />
          Sil
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const WithSubmenu: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Aşama değiştir</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-52">
        <DropdownMenuLabel>SP-1004</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>İleri taşı</DropdownMenuItem>
          <DropdownMenuItem>Geri al</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Aşamaya taşı</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {["Alındı", "Kesim", "Dikim", "Ütü & Paket", "Sevk edildi"].map((stage) => (
              <DropdownMenuItem key={stage}>{stage}</DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const Filters: Story = {
  parameters: {
    docs: {
      description: {
        story: "Checkbox and radio items — how the order list filters columns and sorting.",
      },
    },
  },
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Görünüm</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-52">
        <DropdownMenuLabel>Sütunlar</DropdownMenuLabel>
        <DropdownMenuCheckboxItem checked>Müşteri</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked>Termin tarihi</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem>Notlar</DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Sırala</DropdownMenuLabel>
        <DropdownMenuRadioGroup value="yeni">
          <DropdownMenuRadioItem value="yeni">En yeni</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="eski">En eski</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="termin">Termine göre</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};
