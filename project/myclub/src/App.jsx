import "./App.css";
import Button from "@mui/material/Button";

function ButtonUsage() {
  return <Button variant="contained">Hello world</Button>;
}
function App() {
  return <div>{ButtonUsage()} </div>;
}

export default App;
