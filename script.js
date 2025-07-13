document.addEventListener('DOMContentLoaded', () => {
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const filterBtns = document.querySelectorAll('.filter-btn');

    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    let currentFilter = 'all';

    const saveTodos = () => {
        localStorage.setItem('todos', JSON.stringify(todos));
    };

    const renderTodos = () => {
        todoList.innerHTML = '';
        const filteredTodos = todos.filter(todo => {
            if (currentFilter === 'completed') return todo.completed;
            if (currentFilter === 'pending') return !todo.completed;
            return true; // 'all'
        });

        if (filteredTodos.length === 0) {
            const emptyMsg = document.createElement('li');
            emptyMsg.className = 'empty-message';
            emptyMsg.textContent = 'タスクはありません。';
            todoList.appendChild(emptyMsg);
            return;
        }

        filteredTodos.forEach(todo => {
            const todoItem = document.createElement('li');
            todoItem.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            todoItem.setAttribute('data-id', todo.id);

            const checkBtn = document.createElement('button');
            checkBtn.className = 'check-btn';
            checkBtn.innerHTML = `<i class="far ${todo.completed ? 'fa-check-square' : 'fa-square'}"></i>`;

            const todoText = document.createElement('span');
            todoText.textContent = todo.text;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';

            todoItem.appendChild(checkBtn);
            todoItem.appendChild(todoText);
            todoItem.appendChild(deleteBtn);
            todoList.appendChild(todoItem);
        });
    };

    const addTodo = (text) => {
        if (text.trim() === '') return;
        const newTodo = {
            id: Date.now(),
            text: text,
            completed: false
        };
        todos.push(newTodo);
        saveTodos();
        renderTodos();
    };

    const toggleComplete = (id) => {
        todos = todos.map(todo => 
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
        saveTodos();
        renderTodos();
    };

    const deleteTodo = (id) => {
        todos = todos.filter(todo => todo.id !== id);
        saveTodos();
        renderTodos();
    };

    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addTodo(todoInput.value);
        todoInput.value = '';
    });

    todoList.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const todoItem = target.parentElement;
        const todoId = Number(todoItem.getAttribute('data-id'));

        if (target.classList.contains('check-btn')) {
            toggleComplete(todoId);
        } else if (target.classList.contains('delete-btn')) {
            deleteTodo(todoId);
        }
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            renderTodos();
        });
    });

    renderTodos();
});
