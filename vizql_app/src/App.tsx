import { createSignal, Show } from "solid-js";
import "./App.css";
import Connection_Page from "./pages/Connect.tsx";
import CreateTableModal from "./components/CreateTableModal.tsx";
import Layout from "./components/Layout";
import { invoke } from "@tauri-apps/api/core";

export const [connected, setConnected] = createSignal(false);
export const [tables, setTables] = createSignal<string[]>([]);

function App() {
  const [showNewTable, setShowNewTable] = createSignal(false);
  const [selectedTable, setSelectedTable] = createSignal<string | null>(null);

  return (
    <>
      <Show when={!connected()}>
        <Connection_Page />
      </Show>

      <Show when={connected()}>
        <Layout
          tables={tables}
          onTableSelect={(tableName) => setSelectedTable(tableName)}
          onCreateClick={() => setShowNewTable(true)}
        >
          <Show when={selectedTable()}>
            <div>
              <h2>{selectedTable()} Details</h2>
              <p>Table schema view will go here</p>
            </div>
          </Show>

          <Show when={!selectedTable()}>
            <div>
              <h2>Welcome</h2>
              <p>Select a table from the left or create a new one</p>
            </div>
          </Show>
        </Layout>

        <CreateTableModal
          show={showNewTable}
          onClose={() => setShowNewTable(false)}
          onCreated={async () => {
            await invoke("list_tables").then((tbls) => {
              setTables(tbls as string[]);
            });
          }}
        />
      </Show>
    </>
  );
}

export default App;
