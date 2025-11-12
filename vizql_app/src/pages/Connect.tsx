import { setConnected, setTables } from "../App.tsx";
import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/core";

function Connection_Page() {
    const [host, setHost] = createSignal("localhost");
    const [port, setPort] = createSignal("5432");
    const [dbname, setDbname] = createSignal("willdomine");
    const [user, setUser] = createSignal("willdomine");
    const [password, setPassword] = createSignal("");


    async function init_connection(
        host: string,
        port: string,
        dbname: string,
        user: string,
        password: string,
    ) {
        try {
            await invoke("connect_db_pool", {
                dbname,
                user,
                password,
                host,
                port,
            });
            await invoke("list_tables").then((tables) => {
                setTables(tables as string[]);
            });
            setConnected(true);
        } catch (error) {
            console.error(`Failed to connect to database: ${error}`);
        }
    }

    return (
        <>
            <form
                class="column container"
                onsubmit={(e) => {
                    e.preventDefault();
                    init_connection(
                        host(),
                        port(),
                        dbname(),
                        user(),
                        password(),
                    );
                }}
            >
                <input
                    type="text"
                    placeholder="Host"
                    value={host()}
                    onInput={(e) => setHost(e.currentTarget.value)}
                />
                <input
                    type="text"
                    placeholder="Port"
                    value={port()}
                    onInput={(e) => setPort(e.currentTarget.value)}
                />
                <input
                    type="text"
                    placeholder="Database"
                    value={dbname()}
                    onInput={(e) => setDbname(e.currentTarget.value)}
                />
                <input
                    type="text"
                    placeholder="User"
                    value={user()}
                    onInput={(e) => setUser(e.currentTarget.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password()}
                    onInput={(e) => setPassword(e.currentTarget.value)}
                />
                <button type="submit">Connect to Database</button>
            </form>
        </>
    );
}

export default Connection_Page;
