const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  db: {
    query: (sql, params) => ipcRenderer.invoke('db:query', sql, params),
    run: (sql, params) => ipcRenderer.invoke('db:run', sql, params),
    get: (sql, params) => ipcRenderer.invoke('db:get', sql, params),
    all: (sql, params) => ipcRenderer.invoke('db:all', sql, params)
  },
  data: {
    export: () => ipcRenderer.invoke('data:export'),
    import: () => ipcRenderer.invoke('data:import'),
    clear: () => ipcRenderer.invoke('data:clear')
  },
  account: {
    list: (type) => ipcRenderer.invoke('account:list', type),
    get: (id) => ipcRenderer.invoke('account:get', id),
    add: (account) => ipcRenderer.invoke('account:add', account),
    update: (id, account) => ipcRenderer.invoke('account:update', id, account),
    remove: (id) => ipcRenderer.invoke('account:delete', id),
    totalBalance: (type) => ipcRenderer.invoke('account:totalBalance', type),
    netWorth: () => ipcRenderer.invoke('account:netWorth'),
    balanceHistory: (type, startDate, endDate) => ipcRenderer.invoke('account:balanceHistory', type, startDate, endDate)
  },
  transaction: {
    add: (transaction, tags) => ipcRenderer.invoke('transaction:add', transaction, tags),
    remove: (id) => ipcRenderer.invoke('transaction:delete', id)
  }
});
