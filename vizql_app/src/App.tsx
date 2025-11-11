import { createSignal, Show } from "solid-js";
import "./App.css";
import Connection_Page from "./pages/Connect.tsx";

export const [connected, setConnected] = createSignal(false);
export const [tables, setTables] = createSignal<string[]>([]);

function App() {

  return (
    <main>
      <Show when={!connected()}>
        <Connection_Page />
      </Show>

      <Show when={connected()}>
        <button>Create Table</button>
        <div style={{ "padding-top": "0px" }}>
          {tables().map((table) => (
          <button>{table}</button>
        ))}
        </div>
      </Show>
    </main>
  );
}

export default App;
