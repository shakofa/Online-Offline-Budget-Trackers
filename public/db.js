let db;

// Create a new db request for a "budget" database.
const request = indexedDB.open('Budget', 1);

request.onupgradeneeded = function ({ target}) {
  console.log('Upgrade needed in IndexDB');

 let db = target.result;

  if (db.objectStoreNames.length === 0) {
    db.createObjectStore('pending', { autoIncrement: true });
  }
};



request.onsuccess = ({target}) => {
    db = target.result;
    // Check if app is online before reading from db
    if (navigator.onLine) {
        checkDatabase();
    }
};



request.onerror = function (e) {
  console.log(`Woops! ${e.target.errorCode}`);
};



const saveRecord = (record) => {

    // Create a transaction on the BudgetStore db with readwrite access
    const transaction = db.transaction(['pending'], 'readwrite');
  
    // Access your BudgetStore object store
    const store = transaction.objectStore('pending');
  
    // Add record to your store with add method.
    store.add(record);
};




function checkDatabase() {

  // Open a transaction on your BudgetStore db
  let transaction = db.transaction(['pending'], 'readwrite');

  // access your BudgetStore object
  const store = transaction.objectStore('pending');

  // Get all records from store and set to a variable
  const getAll = store.getAll();

  // If the request was successful
  getAll.onsuccess = function () {
    // If there are items in the store, we need to bulk add them when we are back online
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((res) => {
          // If our returned response is not empty
          if (res.length !== 0) {
            // Open another transaction to BudgetStore with the ability to read and write
            transaction = db.transaction(['pending'], 'readwrite');

            // Assign the current store to a variable
            const currentStore = transaction.objectStore('pending');

            // Clear existing entries because our bulk add was successful
            currentStore.clear();
            
          }
        });
    }
  };
}



// Listen for app coming back online
window.addEventListener('online', checkDatabase);
