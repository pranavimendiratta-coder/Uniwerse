import { useNavigate } from "react-router-dom";

function BackButton({ to, label = "← Back" }) {
  const navigate = useNavigate();

  function handleClick() {
    if (to) {
      navigate(to);       // specific page pe jao
    } else {
      navigate(-1);        // browser history mein ek step peeche
    }
  }

  return (
    <button className="back-btn" onClick={handleClick}>
      {label}
    </button>
  );
}

export default BackButton;