// // taskResolver.js
// let tasks = [
//     {
//     id: '1',
//     title: 'Développement Front-end pour Site E-commerce',
//     description: 'Créer une interface utilisateur réactive en utilisant React et Reduxpour un site e-commerce.',
//     completed: false,
//     duration : 5
//     },
//     {
//     id: '2',
//     title: 'Développement Back-end pour Authentification Utilisateur',
//     description: "Implémenter un système d'authentification et d'autorisation pour uneapplication web en utilisant Node.js, Express, et Passport.js",
//     completed: false,
//     duration : 3
//     },
//     {
//     id: '3',
//     title: 'Tests et Assurance Qualité pour Application Web',
//     description: 'Développer et exécuter des plans de test et des cas de testcomplets.',
//     completed: false,
//     duration : 2
//     },
//     ];
//     const taskResolver = {
//     Query: {
//     task: (_, { id }) => tasks.find(task => task.id === id),
//     tasks: () => tasks,
//     },
//     Mutation: {
//     addTask: (_, { title, description, completed, duration }) => {
//     const task = {
//     id: String(tasks.length + 1),
//     title,
//     description,
//     completed,
//     duration
//     };
//     tasks.push(task);
//     return task;
//     },
//     completeTask: (_, { id }) => {
//     const taskIndex = tasks.findIndex(task => task.id === id);
//     if (taskIndex !== -1) {
//     tasks[taskIndex].completed = true;
//     return tasks[taskIndex];
//     }
//     return null;
//     },
//     changeDescription: (_, { id, description }) => {
//         const task = tasks.find(task => task.id === id);
//         if (task) task.description = description;
//         return task;
//       },
//       deleteTask: (_, { id }) => {
//         tasks = tasks.filter(task => task.id !== id);
//         return { id };
//       },
//     },
//     };
//     module.exports = taskResolver;

const { addTaskToDB, getTaskFromDB, getAllTasksFromDB, deleteTaskFromDB } = require('./database');

const taskResolver = {
  Query: {
    task: async (_, { id }) => await getTaskFromDB(id),
    tasks: async () => await getAllTasksFromDB(),
  },
  Mutation: {
    addTask: async (_, { title, description, completed, duration }) => {
      const task = { id: String(Date.now()), title, description, completed, duration };
      await addTaskToDB(task);
      return task;
    },
    completeTask: async (_, { id }) => {
      const task = await getTaskFromDB(id);
      if (task) {
        task.completed = true;
        await addTaskToDB(task);
        return task;
      }
      return null;
    },
    changeDescription: async (_, { id, description }) => {
      const task = await getTaskFromDB(id);
      if (task) {
        task.description = description;
        await addTaskToDB(task);
        return task;
      }
      return null;
    },
    deleteTask: async (_, { id }) => {
      await deleteTaskFromDB(id);
      return { id };
    },
  },
};

module.exports = taskResolver;
