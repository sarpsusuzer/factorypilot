import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "./badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

const meta = {
  title: "UI Kit/Table",
  component: Table,
  parameters: {
    docs: {
      description: {
        component:
          "The order list and every line-item grid. Numeric columns take `tabular-nums` and " +
          "right alignment so digits stack in a column — the single most useful thing a table " +
          "of quantities can do.",
      },
    },
  },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

const ROWS = [
  { no: "SP-1001", musteri: "Kaya Mağazacılık", stage: "Alındı", tone: "bg-violet-100 text-violet-700", dot: "bg-violet-500", adet: 250 },
  { no: "SP-1002", musteri: "Kaya Mağazacılık", stage: "Kesim", tone: "bg-blue-100 text-blue-700", dot: "bg-blue-500", adet: 480 },
  { no: "SP-1003", musteri: "Öz Giyim", stage: "Kesim", tone: "bg-blue-100 text-blue-700", dot: "bg-blue-500", adet: 120 },
  { no: "SP-1004", musteri: "Öz Giyim", stage: "Dikim", tone: "bg-teal-100 text-teal-700", dot: "bg-teal-500", adet: 1_248 },
  { no: "SP-1005", musteri: "Nar Tekstil", stage: "Dikim", tone: "bg-teal-100 text-teal-700", dot: "bg-teal-500", adet: 96 },
];

export const Default: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sipariş no</TableHead>
          <TableHead>Müşteri</TableHead>
          <TableHead>Aşama</TableHead>
          <TableHead className="text-right">Adet</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ROWS.map((row) => (
          <TableRow key={row.no}>
            <TableCell className="font-mono tabular-nums">{row.no}</TableCell>
            <TableCell>{row.musteri}</TableCell>
            <TableCell>
              <Badge className={`gap-1.5 font-medium ${row.tone}`}>
                <span className={`size-1.5 shrink-0 rounded-full ${row.dot}`} />
                {row.stage}
              </Badge>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.adet.toLocaleString("tr-TR")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const WithFooterAndCaption: Story = {
  render: () => (
    <Table>
      <TableCaption>Ağustos 2026 — açık siparişler</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Sipariş no</TableHead>
          <TableHead>Müşteri</TableHead>
          <TableHead className="text-right">Adet</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ROWS.map((row) => (
          <TableRow key={row.no}>
            <TableCell className="font-mono tabular-nums">{row.no}</TableCell>
            <TableCell>{row.musteri}</TableCell>
            <TableCell className="text-right tabular-nums">
              {row.adet.toLocaleString("tr-TR")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Toplam</TableCell>
          <TableCell className="text-right tabular-nums">
            {ROWS.reduce((sum, r) => sum + r.adet, 0).toLocaleString("tr-TR")}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};

export const Empty: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "An empty table still renders its header, so the columns stay legible while a filter " +
          "is narrowing results to nothing.",
      },
    },
  },
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sipariş no</TableHead>
          <TableHead>Müşteri</TableHead>
          <TableHead className="text-right">Adet</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
            Bu filtreye uyan sipariş yok.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};
