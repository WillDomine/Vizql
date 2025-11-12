export default function Layout(props: {
  tables: () => string[];
  onTableSelect?: (tableName: string) => void;
  onCreateClick?: () => void;
  children?: any;
}) {
  function handleTableClick(tableName: string) {
    if (props.onTableSelect) props.onTableSelect(tableName);
  }

  function handleCreateClick() {
    if (props.onCreateClick) props.onCreateClick();
  }

  return (
    <div class="layout">
      {/* Left Sidebar - Tables Nav */}
      <aside class="sidebar-left">
        <div class="sidebar-header">
          <h3>Tables</h3>
          <button class="btn-create-table" onClick={handleCreateClick}>
            + New
          </button>
        </div>
        <nav class="tables-list">
          {props.tables().length === 0 ? (
            <p class="empty-msg">No tables yet</p>
          ) : (
            props.tables().map((table) => (
              <button
                class={`table-item`}
                onClick={() => handleTableClick(table)}
              >
                {table}
              </button>
            ))
          )}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main class="content-main">{props.children}</main>
    </div>
  );
}
