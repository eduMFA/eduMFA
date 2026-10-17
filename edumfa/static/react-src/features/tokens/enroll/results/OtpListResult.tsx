import { Trans } from "@lingui/react/macro";
import { Accordion, Box, Button, Group, Stack, Table } from "@mantine/core";
import { IconPrinter } from "@tabler/icons-react";
import { useRef } from "react";

import { type EnrolledTokenResultProps } from "./types";

const otpListColumns = 5;

/** Lays the OTP values out column-wise, like the printed legacy table. */
export function buildOtpListRows(otps: Record<string, string>): string[][] {
  const positions = Object.keys(otps).sort(
    (left, right) => Number(left) - Number(right)
  );
  const rowCount = Math.ceil(positions.length / otpListColumns);
  const rows: string[][] = [];

  for (let row = 0; row < rowCount; row += 1) {
    const cells: string[] = [];

    for (let column = 0; column < otpListColumns; column += 1) {
      const position = positions[row + column * rowCount];

      cells.push(position ?? "", position === undefined ? "" : (otps[position] ?? ""));
    }

    rows.push(cells);
  }

  return rows;
}

export function OtpListResult({ detail, form }: EnrolledTokenResultProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const otps = detail.otps ?? {};
  const rows = buildOtpListRows(otps);

  if (rows.length === 0) {
    return null;
  }

  return (
    <Stack gap="sm">
      <Accordion variant="separated">
        <Accordion.Item value="otps">
          <Accordion.Control>
            {form.type === "tan" ? (
              <Trans>The OTP values</Trans>
            ) : (
              <Trans>The OTP key</Trans>
            )}
          </Accordion.Control>
          <Accordion.Panel>
            <Box
              className={form.type === "tan" ? "tantoken" : "papertoken"}
              id="paperOtpTable"
              ref={tableRef}
            >
              <Table striped withColumnBorders withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    {rows[0]?.map((_, index) => (
                      <Table.Th key={index}>{index % 2 === 0 ? "#" : "OTP"}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {rows.map((cells, rowIndex) => (
                    <Table.Tr key={rowIndex}>
                      {cells.map((cell, cellIndex) => (
                        <Table.Td
                          ff={cellIndex % 2 === 1 ? "monospace" : "text"}
                          key={cellIndex}
                        >
                          {cell}
                        </Table.Td>
                      ))}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
      <Group>
        <Button
          leftSection={<IconPrinter size={16} />}
          onClick={() => {
            printOtpList(detail.serial, tableRef.current?.innerHTML ?? "");
          }}
          variant="default"
        >
          <Trans>Print the OTP list</Trans>
        </Button>
      </Group>
    </Stack>
  );
}

/**
 * Port of `printOtp`: opens a small window with the legacy paper token
 * stylesheet, prints it and closes it again.
 */
export function printOtpList(serial: string, tableHtml: string): void {
  const printWindow = window.open("", "otpPrintingWindow", "height=400,width=600");

  if (!printWindow) {
    return;
  }

  const printDocument = printWindow.document;
  const stylesheet = printDocument.createElement("link");
  const finish = () => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  printDocument.title = serial;
  stylesheet.rel = "stylesheet";
  stylesheet.href = new URL("static/css/papertoken.css", document.baseURI).href;
  stylesheet.addEventListener("load", finish);
  stylesheet.addEventListener("error", finish);
  printDocument.head.appendChild(stylesheet);
  printDocument.body.innerHTML = tableHtml;
}
