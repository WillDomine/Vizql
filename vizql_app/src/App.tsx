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
  const [selectedTableColumns, setSelectedTableColumns] = createSignal<any[]>([]);

  async function get_table_columns(tableName: string) {
    await invoke("list_table_columns", { tableName: tableName }).then((cols) => {
      setSelectedTableColumns(cols as any[]);
    });
  }

  return (
    <>
      <Show when={!connected()}>
        <Connection_Page />
      </Show>

      <Show when={connected()}>
        <Layout
          tables={tables}
          onTableSelect={async (tableName) => {
            setSelectedTable(tableName);
            await get_table_columns(tableName);
          }}
          onCreateClick={() => setShowNewTable(true)}
        >
          <Show when={selectedTable()}>
            <div>
              <h2>{selectedTable()!.charAt(0).toUpperCase() + selectedTable()!.slice(1)} Table Columns</h2>
              
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
