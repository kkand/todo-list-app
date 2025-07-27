document.addEventListener('DOMContentLoaded', () => {
  // Firebase Authenticationのインスタンスを取得
  const auth = firebase.auth();
  // Firebase Firestoreのインスタンスを取得
  const db = firebase.firestore();

  // --- DOM要素の取得 ---
  // 認証エリア
  const authContainer = document.getElementById('auth-container');
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');

  // ToDoエリア
  const todoContainer = document.getElementById('todo-container');
  const userEmailSpan = document.getElementById('user-email');

  // --- 認証関連のボタン ---
  const signupBtn = document.getElementById('signup-btn');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');

  // --- ToDo関連の要素 ---
  const addTaskBtn = document.getElementById('add-task-btn');
  const taskInput = document.getElementById('task-input');
  const taskList = document.getElementById('task-list');
  const filterSelect = document.getElementById('filter-select'); // 新しく追加
  const sortSelect = document.getElementById('sort-select');     // 新しく追加

  let currentUser = null; // 現在ログインしているユーザー
  let currentFilter = 'all'; // 現在のフィルター状態
  let currentSort = 'newest'; // 現在のソート状態

  // --- 関数: タスクをFirestoreから読み込み、表示する ---
  const loadTasks = async (userId) => {
    taskList.innerHTML = ''; // 現在のリストをクリア
    if (!userId) return; // ユーザーIDがない場合は何もしない

    console.log("Loading tasks for user:", userId, "Filter:", currentFilter, "Sort:", currentSort);
    try {
      let tasksRef = db.collection('users').doc(userId).collection('tasks');

      // フィルタリング
      if (currentFilter === 'completed') {
        tasksRef = tasksRef.where('completed', '==', true);
      } else if (currentFilter === 'active') {
        tasksRef = tasksRef.where('completed', '==', false);
      }

      // ソート
      if (currentSort === 'newest') {
        tasksRef = tasksRef.orderBy('timestamp', 'desc');
      } else if (currentSort === 'oldest') {
        tasksRef = tasksRef.orderBy('timestamp', 'asc');
      }

      const snapshot = await tasksRef.get();

      if (snapshot.empty) {
        console.log("No tasks found for this user with current filter/sort.");
      }

      snapshot.forEach(doc => {
        console.log("Found task:", doc.id, doc.data().text);
        addTaskToDOM(doc.id, doc.data().text, doc.data().completed);
      });
    } catch (error) {
      console.error("タスクの読み込みエラー:", error);
    }
  };

  // --- 関数: タスクをDOMに追加する ---
  const addTaskToDOM = (taskId, taskText, completed = false) => {
    const li = document.createElement('li');
    li.dataset.taskId = taskId; // FirestoreのドキュメントIDを保存

    const taskContent = document.createElement('div');
    taskContent.className = 'task-content';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = completed;
    checkbox.addEventListener('change', async () => {
      if (currentUser) {
        try {
          await db.collection('users').doc(currentUser.uid).collection('tasks').doc(taskId).update({
            completed: checkbox.checked
          });
          li.classList.toggle('completed', checkbox.checked);
          console.log("タスクの完了状態を更新しました:", taskId, checkbox.checked);
          // フィルターが適用されている場合、再読み込みして表示を更新
          if (currentFilter !== 'all') {
            loadTasks(currentUser.uid);
          }
        } catch (error) {
          console.error("タスクの完了状態更新エラー:", error);
        }
      }
    });

    const span = document.createElement('span');
    span.textContent = taskText;
    span.className = 'task-text'; // スタイル用にクラスを追加

    taskContent.appendChild(checkbox);
    taskContent.appendChild(span);
    li.appendChild(taskContent);

    // 編集ボタン
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'edit-btn'; // スタイル用にクラスを追加
    editBtn.onclick = () => {
      if (currentUser) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = span.textContent;
        input.className = 'edit-input'; // スタイル用にクラスを追加

        // spanをinputに置き換え
        taskContent.replaceChild(input, span);
        input.focus();

        // 保存処理
        const saveTask = async () => {
          const newText = input.value.trim();
          if (newText === "") {
            alert("タスクは空にできません。");
            input.focus();
            return;
          }
          if (newText !== taskText) { // テキストが変更された場合のみ更新
            try {
              await db.collection('users').doc(currentUser.uid).collection('tasks').doc(taskId).update({
                text: newText
              });
              span.textContent = newText;
              console.log("タスクを更新しました:", taskId, newText);
            } catch (error) {
              console.error("タスクの更新エラー:", error);
              alert("タスクの更新に失敗しました。" + error.message);
            }
          }
          // inputをspanに戻す
          taskContent.replaceChild(span, input);
          li.removeChild(saveBtn); // 保存ボタンを削除
          li.insertBefore(editBtn, deleteBtn); // 編集ボタンを元に戻す
        };

        // 保存ボタンを作成
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.className = 'save-btn'; // スタイル用にクラスを追加
        saveBtn.onclick = saveTask;

        // Enterキーでの保存
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            saveTask();
          }
        });

        li.insertBefore(saveBtn, deleteBtn); // 保存ボタンを削除ボタンの前に挿入
        li.removeChild(editBtn); // 編集ボタンを削除
      }
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'delete-btn'; // スタイル用にクラスを追加
    deleteBtn.onclick = async () => {
      if (currentUser) {
        try {
          await db.collection('users').doc(currentUser.uid).collection('tasks').doc(taskId).delete();
          li.remove();
          console.log("タスクを削除しました:", taskId);
          // フィルターが適用されている場合、再読み込みして表示を更新
          if (currentFilter !== 'all') {
            loadTasks(currentUser.uid);
          }
        } catch (error) {
          console.error("タスクの削除エラー:", error);
        }
      }
    };

    li.appendChild(editBtn); // 編集ボタンを追加
    li.appendChild(deleteBtn);
    taskList.appendChild(li);

    // 完了状態に応じてクラスを適用
    if (completed) {
      li.classList.add('completed');
    }
  };


  // --- イベントリスナー ---

  // 1. 新規登録ボタン
  signupBtn.addEventListener('click', () => {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    if (!email || !password) {
      alert('メールアドレスとパスワードを入力してください。');
      return;
    }

    auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        console.log('ユーザー登録成功:', userCredential.user);
      })
      .catch((error) => {
        console.error('ユーザー登録エラー:', error);
        alert('ユーザー登録に失敗しました。' + error.message);
      });
  });

  // 2. ログインボタン
  loginBtn.addEventListener('click', () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      alert('メールアドレスとパスワードを入力してください。');
      return;
    }

    auth.signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        console.log('ログイン成功:', userCredential.user);
      })
      .catch((error) => {
        console.error('ログインエラー:', error);
        alert('ログインに失敗しました。' + error.message);
      });
  });

  // 3. ログアウトボタン
  logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => {
      console.log('ログアウトしました。');
    }).catch((error) => {
      console.error('ログアウトエラー:', error);
    });
  });


  // 4. ログイン状態の監視
  auth.onAuthStateChanged(user => {
    if (user) {
      // --- ログインしている場合 ---
      currentUser = user; // 現在のユーザーをセット
      console.log('ログイン状態:', currentUser.email, 'UID:', currentUser.uid);
      authContainer.style.display = 'none';
      todoContainer.style.display = 'block';
      userEmailSpan.textContent = currentUser.email;
      loadTasks(currentUser.uid); // ユーザーのタスクを読み込む

    } else {
      // --- ログアウトしている場合 ---
      currentUser = null; // 現在のユーザーをクリア
      console.log('ログアウト状態');
      authContainer.style.display = 'block';
      todoContainer.style.display = 'none';
      userEmailSpan.textContent = '';
      taskList.innerHTML = ''; // タスクリストもクリア
    }
  });

  // 5. フィルター選択時のイベント
  filterSelect.addEventListener('change', () => {
    currentFilter = filterSelect.value;
    if (currentUser) {
      loadTasks(currentUser.uid);
    }
  });

  // 6. ソート選択時のイベント
  sortSelect.addEventListener('change', () => {
    currentSort = sortSelect.value;
    if (currentUser) {
      loadTasks(currentUser.uid);
    }
  });


  // --- タスク追加ボタン (Firestoreに保存) ---
  addTaskBtn.addEventListener('click', async () => {
    const taskText = taskInput.value.trim();
    console.log("Add Task button clicked. Task text:", taskText, "Current user:", currentUser);

    if (taskText === "" || !currentUser) {
      console.log("Task text is empty or no user logged in. Aborting.");
      return;
    }

    try {
      console.log("Attempting to add task to Firestore for user:", currentUser.uid, "with text:", taskText);
      // Firestoreにタスクを追加
      const docRef = await db.collection('users').doc(currentUser.uid).collection('tasks').add({
        text: taskText,
        completed: false, // 新しく追加: 完了状態をfalseで初期化
        timestamp: firebase.firestore.FieldValue.serverTimestamp() // サーバーのタイムスタンプ
      });
      console.log("Task successfully added to Firestore. Document ID:", docRef.id);

      // DOMにも追加
      addTaskToDOM(docRef.id, taskText, false); // completedを渡す
      taskInput.value = '';

    } catch (error) {
      console.error("タスクの追加エラー (Firestore write failed):", error);
      alert("タスクの追加に失敗しました。" + error.message);
    }
  });
});
