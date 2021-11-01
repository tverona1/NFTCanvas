import { useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const errorToastId = "error-toast-id";
const persistenToastId = "persistent-toast-id";
const successToastId = "success-toast-id";

/**
 * Error message alert
 */
export function ToastMessageContainer() {
  return (
    <ToastContainer
      style={{wordBreak:"break-word"}}
      position="top-right"
      autoClose={10000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick={false}
      rtl={false}
      pauseOnFocusLoss={false}
      pauseOnHover={true}
      draggable
    />
  )
}

type Props = {
  message: string | JSX.Element;
  onClose: () => void;
}

export function ErrorToast(props: Props) {
  useEffect(() => {
    props.message && toast.error(props.message, {
      onClose: props.onClose,
      toastId: errorToastId
    });
  }, [props.message, props.onClose]);

  return (null);
}

export function PersistentToast(props: {message: string}) {
  useEffect(() => {
    props.message && toast.info(props.message, {
      toastId: persistenToastId,
      autoClose: false,
      draggable: false,
      closeButton: false
    });
    return function cleanup() {
      toast.dismiss(persistenToastId);
    }
  }, [props.message]);

  return (null);
}

export function SuccessToast(props: {message: string}) {
  useEffect(() => {
    props.message && toast.success(props.message, {
      toastId: successToastId
    });
 }, [props.message]);

  return (null);
}

export function invokeSuccessToast(message: string) {
  toast.success(message, {
    toastId: successToastId
  });
}