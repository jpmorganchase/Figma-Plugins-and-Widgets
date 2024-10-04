import { StackLayout, StatusIndicator, Text } from "@salt-ds/core";

// Salt pattern - https://www.saltdesignsystem.com/salt/patterns/content-status
export const ContentStatus = (props: { message: string; title: string }) => {
  return (
    <StackLayout>
      <StatusIndicator status="info" size={2} />
      <StackLayout gap={1}>
        <Text>
          <strong>{props.title}</strong>
        </Text>
        <Text>{props.message}</Text>
      </StackLayout>
    </StackLayout>
  );
};
