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

  let currentUser = null; // 現在ログインしているユーザー

  // --- 関数: タスクをFirestoreから読み込み、表示する ---
  const loadTasks = async (userId) => {
    taskList.innerHTML = ''; // 現在のリストをクリア
    if (!userId) return; // ユーザーIDがない場合は何もしない

    try {
      const tasksRef = db.collection('users').doc(userId).collection('tasks').orderBy('timestamp', 'asc');
      const snapshot = await tasksRef.get();

      snapshot.forEach(doc => {
        addTaskToDOM(doc.id, doc.data().text);
      });
    } catch (error) {
      console.error("タスクの読み込みエラー:", error);
    }
  };

  // --- 関数: タスクをDOMに追加する ---
  const addTaskToDOM = (taskId, taskText) => {
    const li = document.createElement('li');
    li.textContent = taskText;
    li.dataset.taskId = taskId; // FirestoreのドキュメントIDを保存

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = async () => {
      if (currentUser) {
        try {
          await db.collection('users').doc(currentUser.uid).collection('tasks').doc(taskId).delete();
          li.remove();
          console.log("タスクを削除しました:", taskId);
        } catch (error) {
          console.error("タスクの削除エラー:", error);
        }
      }
    };

    li.appendChild(deleteBtn);
    taskList.appendChild(li);
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
      console.log('ログイン状態:', currentUser.email);
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


  // --- タスク追加ボタン (Firestoreに保存) ---
  addTaskBtn.addEventListener('click', async () => {
    const taskText = taskInput.value.trim();
    if (taskText === "" || !currentUser) {
      return;
    }

    try {
      // Firestoreにタスクを追加
      const docRef = await db.collection('users').doc(currentUser.uid).collection('tasks').add({
        text: taskText,
        timestamp: firebase.firestore.FieldValue.serverTimestamp() // サーバーのタイムスタンプ
      });
      console.log("タスクを追加しました。ID:", docRef.id);

      // DOMにも追加
      addTaskToDOM(docRef.id, taskText);
      taskInput.value = '';

    } catch (error) {
      console.error("タスクの追加エラー:", error);
      alert("タスクの追加に失敗しました。" + error.message);
    }
  });
});