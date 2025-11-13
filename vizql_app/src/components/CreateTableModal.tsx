import { createSignal, Show, For } from "solid-js";
import { invoke } from "@tauri-apps/api/core";

type Column = { id: string; name: string; type: string };

export default function CreateTableModal(props: {
    show: () => boolean;
    onClose: () => void;
    onCreated?: (msg: string) => void;
}) {
    const [tableName, setTableName] = createSignal("");
    const [columns, setColumns] = createSignal<Column[]>([]);
    const [busy, setBusy] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);
    let nextId = 0;

    // Map to store individual column field signals to preserve focus
    const columnFields = new Map<string, { name: () => string; type: () => string; setName: (v: string) => void; setType: (v: string) => void }>();

    function generate_id() {
        return `col_${nextId++}`;
    }

    function create_column_signals(id: string, initialName: string, initialType: string) {
        if (columnFields.has(id)) {
            return columnFields.get(id)!;
        }
        const [name, setName] = createSignal(initialName);
        const [type, setType] = createSignal(initialType);
        const signals = { name, type, setName, setType };
        columnFields.set(id, signals);
        return signals;
    }

    function remove_column(id: string) {
        columnFields.delete(id);
        setColumns(columns().filter((col) => col.id !== id));
    }

    function add_column() {
        const id = generate_id();
        create_column_signals(id, "", "TEXT");
        setColumns([
            ...columns(),
            { id, name: "", type: "TEXT" },
        ]);
    }

    async function submit() {
        setError(null);
        if (!tableName().trim()) {
            setError("Table name required");
            return;
        }

        // Validate all columns have names
        const allColumns = columns();
        if (allColumns.some((col) => {
            const signals = columnFields.get(col.id);
            return !signals || !signals.name().trim();
        })) {
            setError("All columns must have a name");
            return;
        }
        if (allColumns.length === 0) {
            setError("At least one column required");
            return;
        }

        setBusy(true);
        try {
            await invoke("create_table", {
                tableName: tableName().trim(),
                columns: allColumns.map((col) => {
                    const signals = columnFields.get(col.id);
                    return {
                        name: (signals?.name() || "").trim(),
                        type: (signals?.type() || "TEXT").trim(),
                    };
                }),
            });
            if (props.onCreated) props.onCreated(tableName().trim());
            setTableName("");
            setColumns([]);
            columnFields.clear();
            nextId = 0;
            props.onClose();
        } catch (e) {
            setError(String(e));
        } finally {
            setBusy(false);
        }
    }

    return (
        <Show when={props.show()}>
            <div class="modal-overlay" onClick={() => props.onClose()}>
                <div class="modal" onClick={(e) => e.stopPropagation()}>
                    <header class="modal-header">
                        <h3>Create Table</h3>
                        <button
                            class="modal-close"
                            onClick={() => props.onClose()}
                        >
                            ✕
                        </button>
                    </header>

                    <div class="modal-body">
                        <label>
                            Table name
                            <input
                                type="text"
                                value={tableName()}
                                onInput={(e) =>
                                    setTableName(e.currentTarget.value)}
                                autocomplete="off"
                                autocapitalize="off"
                            />
                        </label>

                        <div class="modal-section">
                            <strong>{columns().length > 0 ? "Columns" : "Add columns below"}</strong>
                            <For each={columns()}>
                                {(col) => {
                                    const signals = create_column_signals(col.id, col.name, col.type);
                                    return (
                                        <div class="columns-row">
                                            <input
                                                placeholder="column name"
                                                value={signals.name()}
                                                onInput={(e) => {
                                                    signals.setName(e.currentTarget.value);
                                                }}
                                                autocomplete="off"
                                                autocapitalize="off"
                                            />
                                            <select
                                                value={signals.type()}
                                                onChange={(e) => {
                                                    signals.setType(e.currentTarget.value);
                                                }}
                                                class="column-type-select"
                                            >
                                                <option value="TEXT">TEXT</option>
                                                <option value="INTEGER">INTEGER</option>
                                                <option value="BIGINT">BIGINT</option>
                                                <option value="SMALLINT">SMALLINT</option>
                                                <option value="DECIMAL">DECIMAL</option>
                                                <option value="REAL">REAL</option>
                                                <option value="DOUBLE PRECISION">DOUBLE PRECISION</option>
                                                <option value="BOOLEAN">BOOLEAN</option>
                                                <option value="DATE">DATE</option>
                                                <option value="TIME">TIME</option>
                                                <option value="TIMESTAMP">TIMESTAMP</option>
                                                <option value="UUID">UUID</option>
                                                <option value="JSON">JSON</option>
                                                <option value="JSONB">JSONB</option>
                                                <option value="BYTEA">BYTEA</option>
                                                <option value="VARCHAR">VARCHAR</option>
                                                <option value="CHAR">CHAR</option>
                                            </select>
                                            <button class="column-remove" onClick={() => remove_column(col.id)}>×</button>
                                        </div>
                                    );
                                }}
                            </For>
                        </div>

                        {error() && <p class="error">{error()}</p>}
                    </div>

                        <footer class="modal-footer">
                        <button
                            onClick={() => props.onClose()}
                            disabled={busy()}
                        >
                            Cancel
                        </button>
                        <button onClick={add_column} disabled={busy()}>
                            + Add Column
                        </button>
                        <button onClick={submit} disabled={busy()}>
                            {busy() ? "Creating..." : "Create Table"}
                        </button>
                    </footer>
                </div>
            </div>
        </Show>
    );
}
