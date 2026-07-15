import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/layout";

export default function OrderNotificationEmail({ orderId, status }: { orderId: string; status: string }) {
  return (
    <EmailLayout preview={`Order ${orderId} update`}>
      <Heading style={{ color: "#fff", fontSize: "24px" }}>Order update</Heading>
      <Text style={{ color: "#d4d4d8", lineHeight: "24px" }}>
        Order <strong>{orderId}</strong> status changed to <strong>{status}</strong>.
      </Text>
    </EmailLayout>
  );
}
