import { Text } from "@react-pdf/renderer";

export default function LiquidationNumber({ number, top }: { number?: string | null; top: number }) {
  if (!number) return null;
  return (
    <Text style={{ position: "absolute", top, right: 0, width: "40%", color: "#ffffff", fontSize: 9, textAlign: "center" }}>
      N° {number}
    </Text>
  );
}
