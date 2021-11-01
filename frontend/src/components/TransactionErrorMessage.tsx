import React from "react";
import { ErrorToast } from "./ToastMessage";

type Props = {
  message: string;
  dismiss: () => void
}

/**
 * Transaction error message alert
 */
export default function TransactionErrorMessage(props: Props) {
  return (
    <ErrorToast
      message={`Error sending transaction: ${props.message.substring(0, 500)}`}
      onClose={props.dismiss}
    />
  )
}
