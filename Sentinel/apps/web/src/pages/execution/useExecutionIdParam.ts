import { useParams } from "react-router";

/** Every route nested under `/executions/:executionId` shares this param. */
export function useExecutionIdParam(): string {
  const { executionId } = useParams<{ executionId: string }>();
  if (!executionId) {
    throw new Error("useExecutionIdParam() used outside an /executions/:executionId route");
  }
  return executionId;
}
