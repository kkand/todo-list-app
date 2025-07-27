document.addEventListener('DOMContentLoaded', () => {
  // Firebase Authenticationのインスタンスを取得
  const auth = firebase.auth();

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
        // 登録成功
        console.log('ユーザー登録成功:', userCredential.user);
        // 登録後、自動的にログイン状態になる
      })
      .catch((error) => {
        // 登録失敗
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
        // ログイン成功
        console.log('ログイン成功:', userCredential.user);
      })
      .catch((error) => {
        // ログイン失敗
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
      console.log('ログイン状態:', user.email);
      // ログインフォームを非表示
      authContainer.style.display = 'none';
      // ToDoリストを表示
      todoContainer.style.display = 'block';
      // ユーザーのメールアドレスを表示
      userEmailSpan.textContent = user.email;

    } else {
      // --- ログアウトしている場合 ---
      console.log('ログアウト状態');
      // ログインフォームを表示
      authContainer.style.display = 'block';
      // ToDoリストを非表示
      todoContainer.style.display = 'none';
      // ユーザー情報をクリア
      userEmailSpan.textContent = '';
      // タスクリストもクリア
      taskList.innerHTML = '';
    }
  });


  // --- 元々のToDoリストの機能 ---
  // タスク追加ボタン
  addTaskBtn.addEventListener('click', () => {
    const taskText = taskInput.value;
    if (taskText === "") {
      return;
    }

    const li = document.createElement('li');
    li.textContent = taskText;

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => {
      li.remove();
    };

    li.appendChild(deleteBtn);
    taskList.appendChild(li);

    taskInput.value = '';
  });
});
