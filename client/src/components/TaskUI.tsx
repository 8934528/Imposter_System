import React from "react";
import { FaCheck, FaClock, FaTimes } from "react-icons/fa";
import "../styles/components/TaskUI.css";

interface Task {
  id: string;
  name: string;
  description: string;
  completed: boolean;
}

interface TaskUIProps {
  tasks: Task[];
  onTaskComplete: (taskId: string) => void;
  onTaskSkip: (taskId: string) => void;
}

const TaskUI: React.FC<TaskUIProps> = ({
  tasks,
  onTaskComplete,
  onTaskSkip,
}) => {
  const completedTasks = tasks.filter((task) => task.completed).length;
  const totalTasks = tasks.length;

  return (
    <div className="task-ui">
      <div className="task-header">
        <h3>Tasks</h3>
        <div className="task-progress">
          {completedTasks} / {totalTasks} Completed
        </div>
      </div>

      <div className="task-list">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`task-item ${task.completed ? "completed" : ""}`}
          >
            <div
              className={`task-checkbox ${task.completed ? "checked" : ""}`}
              onClick={() => !task.completed && onTaskComplete(task.id)}
            />
            <div className="task-details">
              <div className="task-name">{task.name}</div>
              <div className="task-description">{task.description}</div>
            </div>
            <div
              className={`task-status ${task.completed ? "completed" : "pending"}`}
            >
              {task.completed ? "Completed" : "Pending"}
            </div>
          </div>
        ))}
      </div>

      <div className="task-actions">
        <button
          className="task-btn complete-btn"
          onClick={() => {
            const pendingTask = tasks.find((task) => !task.completed);
            if (pendingTask) onTaskComplete(pendingTask.id);
          }}
          disabled={completedTasks === totalTasks}
        >
          <FaCheck /> Complete Next Task
        </button>
        <button
          className="task-btn skip-btn"
          onClick={() => {
            const pendingTask = tasks.find((task) => !task.completed);
            if (pendingTask) onTaskSkip(pendingTask.id);
          }}
          disabled={completedTasks === totalTasks}
        >
          <FaTimes /> Skip Task
        </button>
      </div>

      {completedTasks < totalTasks && (
        <div className="task-timer">
          <FaClock /> Complete all tasks to win!
        </div>
      )}
    </div>
  );
};

export default TaskUI;
