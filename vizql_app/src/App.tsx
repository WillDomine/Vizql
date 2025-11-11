import { createSignal, Show } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [host, setHost] = createSignal("localhost");
  const [port, setPort] = createSignal("5432");
  const [dbname, setDbname] = createSignal("mydb");
  const [user, setUser] = createSignal("postgres");
  const [password, setPassword] = createSignal("");
  const [connectionMsg, setConnectionMsg] = createSignal("");
  const [connected, setConnected] = createSignal(false);

  const [username, setUsername] = createSignal("");
  const [email, setEmail] = createSignal("");

  async function init_connection(host: string, port: string, dbname: string, user: string, password: string) {
    try {
      await invoke("connect_db_pool", { dbname, user, password, host, port });
      setConnectionMsg("Database connection pool initialized successfully.");
      setConnected(true);
    } catch (error) {
      setConnectionMsg(`Failed to initialize database connection pool: ${error}`);
    }
  }

  async function create_user(username: string, email: string) {
    try {
      await invoke("create_user", { username, email });
      setConnectionMsg("User created successfully.");
    } catch (error) {
      setConnectionMsg(`Failed to create user: ${error}`);
    }
  }

  return (
    <main class="container">
      <Show when={!connected()}>
        <form class="column" onsubmit={(e) => {
          e.preventDefault();
          init_connection(host(), port(), dbname(), user(), password());
        }}>
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
      </Show>

      <p>{connectionMsg()}</p>

      <Show when={connected()}>
        <form class="column" onsubmit={(e) => {
          e.preventDefault()
          create_user(username(), email())
        }}>
          <input 
            type="text" 
            placeholder="Username" 
            value={username()} 
            onInput={(e) => setUsername(e.currentTarget.value)} 
          />
          <input 
            type="email" 
            placeholder="Email" 
            value={email()} 
            onInput={(e) => setEmail(e.currentTarget.value)} 
          />
          <button type="submit">Create User</button>
        </form>
      </Show>

    </main>
  );
}

export default App;
