export const sqliteSchemaDraft = {
  tables: {
    sessions: {
      id: 'TEXT PRIMARY KEY',
      title: 'TEXT NOT NULL',
      cwd: 'TEXT NOT NULL',
      status: 'TEXT NOT NULL',
      source: 'TEXT NOT NULL',
      started_at: 'TEXT',
      updated_at: 'TEXT',
      last_command: 'TEXT',
      last_command_id: 'TEXT',
      exit_code: 'INTEGER'
    },
    commands: {
      id: 'TEXT PRIMARY KEY',
      session_id: 'TEXT NOT NULL',
      command: 'TEXT NOT NULL',
      kind: 'TEXT NOT NULL',
      status: 'TEXT NOT NULL',
      risk: 'TEXT NOT NULL',
      started_at: 'TEXT NOT NULL',
      finished_at: 'TEXT',
      exit_code: 'INTEGER',
      summary: 'TEXT',
      approval_id: 'TEXT'
    },
    events: {
      id: 'TEXT PRIMARY KEY',
      title: 'TEXT NOT NULL',
      detail: 'TEXT NOT NULL',
      tone: 'TEXT NOT NULL',
      category: 'TEXT',
      timestamp: 'TEXT NOT NULL'
    },
    approvals: {
      id: 'TEXT PRIMARY KEY',
      title: 'TEXT NOT NULL',
      risk: 'TEXT NOT NULL',
      preview: 'TEXT NOT NULL',
      rationale: 'TEXT',
      impact: 'TEXT',
      command_preview: 'TEXT',
      rollback_hint: 'TEXT'
    }
  }
} as const;
