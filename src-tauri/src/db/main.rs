use tauri_plugin_sql::{Migration, MigrationKind};

/// Returns all database migrations
pub fn migrations() -> Vec<Migration> {
    vec![
        // Migration 1: Create system_prompts table with indexes and triggers
        Migration {
            version: 1,
            description: "create_system_prompts_table",
            sql: include_str!("migrations/system-prompts.sql"),
            kind: MigrationKind::Up,
        },
        // Migration 2: Create chat history tables (conversations and messages)
        Migration {
            version: 2,
            description: "create_chat_history_tables",
            sql: include_str!("migrations/chat-history.sql"),
            kind: MigrationKind::Up,
        },
        // Migration 3: Create knowledge documents table (RAG level 1)
        Migration {
            version: 3,
            description: "create_knowledge_documents_table",
            sql: include_str!("migrations/knowledge.sql"),
            kind: MigrationKind::Up,
        },
        // Migration 4: Rendez-vous commerciaux (preparation, suivi, compte-rendu)
        Migration {
            version: 4,
            description: "create_rendez_vous_table",
            sql: include_str!("migrations/rendez-vous.sql"),
            kind: MigrationKind::Up,
        },
    ]
}
