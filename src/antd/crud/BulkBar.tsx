import { Button, Flex, Typography } from 'antd';
import { useInsta } from '../../react/context.tsx';
import type { ResolvedAction } from '../../core/actions.ts';
import { ActionButton } from '../actions.tsx';

/** "N selected", the bulk actions, and clear. */
export function BulkBar({
  actions,
  count,
  onRun,
  onClear,
}: {
  actions: ResolvedAction[];
  count: number;
  onRun(action: ResolvedAction): void;
  onClear(): void;
}) {
  const { messages } = useInsta();
  return (
    <Flex align="center" gap={8} wrap style={{ marginBottom: 12 }}>
      <Typography.Text type="secondary">{messages.selected(count)}</Typography.Text>
      {actions.map((a) => (
        <ActionButton key={a.key} action={a} disabled={count === 0} onClick={() => onRun(a)} />
      ))}
      {count > 0 ? (
        <Button type="link" size="small" onClick={onClear}>
          {messages.clearSelection}
        </Button>
      ) : null}
    </Flex>
  );
}
