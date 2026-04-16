import { toast } from "react-toastify";
import { googleBtn } from "../../styles/authStyles";

export function GoogleButton() {
  return (
    <button
      style={googleBtn}
      onClick={() => {
        console.log('Google OAuth');
        toast.info('Google login belum diimplementasikan')
      }}
    >
      Login with Google
    </button>
  );
}