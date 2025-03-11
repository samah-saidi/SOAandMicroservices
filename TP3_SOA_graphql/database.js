const level = require('level');

// Création d'une base de données LevelDB
const db = level('./taskDB', { valueEncoding: 'json' });

const addTaskToDB = async (task) => {
  await db.put(task.id, task);
};

const getTaskFromDB = async (id) => {
  try {
    return await db.get(id);
  } catch (error) {
    return null; // Retourne null si la tâche n'existe pas
  }
};

const getAllTasksFromDB = async () => {
  const tasks = [];
  for await (const [_, value] of db.iterator()) {
    tasks.push(value);
  }
  return tasks;
};

const deleteTaskFromDB = async (id) => {
  await db.del(id);
};

module.exports = { addTaskToDB, getTaskFromDB, getAllTasksFromDB, deleteTaskFromDB };
