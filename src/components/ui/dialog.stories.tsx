import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Input } from "./input";
import { Label } from "./label";

const meta = {
  title: "UI Kit/Dialog",
  component: Dialog,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Modal surface at `--radius-2xl`. Every dialog in the product is a short, focused edit " +
          "or a confirmation — anything longer belongs on its own page. `showCloseButton={false}` " +
          "forces a deliberate choice, which is what destructive confirmations use.",
      },
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Aşamayı yeniden adlandır</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aşamayı yeniden adlandır</DialogTitle>
          <DialogDescription>
            Bu aşamadaki siparişler yeni ada taşınır — geçmiş korunur.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label htmlFor="stage-name">Aşama adı</Label>
          <Input id="stage-name" defaultValue="Kesim" />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Vazgeç</Button>
          </DialogClose>
          <Button>Kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const Destructive: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "No close button and no overlay dismissal — the only ways out are the two footer " +
          "buttons, so the choice is always explicit.",
      },
    },
  },
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Siparişi sil</Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>SP-1004 silinsin mi?</DialogTitle>
          <DialogDescription>
            Sipariş ve tüm aşama geçmişi kalıcı olarak silinir. Bu işlem geri alınamaz.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Vazgeç</Button>
          </DialogClose>
          <Button variant="destructive">Kalıcı olarak sil</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const Form: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Kullanıcı ekle</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kullanıcı ekle</DialogTitle>
          <DialogDescription>Yeni kullanıcıya bir rol atayın.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="u-name">Ad soyad</Label>
            <Input id="u-name" placeholder="Ayşe Demir" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="u-email">E-posta</Label>
            <Input id="u-email" type="email" placeholder="ayse@demirtekstil.com" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Vazgeç</Button>
          </DialogClose>
          <Button>Ekle</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
