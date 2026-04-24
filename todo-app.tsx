"use client";

import axios from "axios";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { todoSchema, type TodoFormValues } from "@/components/todo/schema";
import { TodoForm } from "@/components/todo/todo-form";
import { TodoListCard } from "@/components/todo/todo-list-card";
import { TodoStats } from "@/components/todo/todo-stats";
import { Spinner } from "@/components/ui/spinner";
import type { Todo } from "@/components/todo/types";

export function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axios
      .get<Array<Todo & { createdAt: string }>>("/api/todos")
      .then((res) =>
        setTodos(
          res.data.map((t) => ({ ...t, createdAt: new Date(t.createdAt) })),
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TodoFormValues>({
    resolver: standardSchemaResolver(todoSchema),
    defaultValues: { task: "" },
  });

  async function onSubmit(data: TodoFormValues) {
    setSubmitting(true);
    try {
      const res = await axios.post<Todo & { createdAt: string }>(
        "/api/todos",
        { task: data.task.trim() },
        {
          headers: { "Content-Type": "application/json" },
        },
      );
      const newTodo = res.data;
      setTodos((prev) => [
        { ...newTodo, createdAt: new Date(newTodo.createdAt) },
        ...prev,
      ]);
      reset();
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleTodo(id: string) {
    const res = await axios.patch<Todo & { createdAt: string }>(
      `/api/todos/${id}`,
      {},
      {
        headers: { "Content-Type": "application/json" },
      },
    );
    const updated = res.data;
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...updated, createdAt: new Date(updated.createdAt) }
          : t,
      ),
    );
  }

  async function deleteTodo(id: string) {
    await axios.delete(`/api/todos/${id}`);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  const activeTodos = todos.filter((t) => !t.completed);
  const completedTodos = todos.filter((t) => t.completed);

  return (
    <div className="min-h-screen bg-background flex items-start justify-center px-4 py-16">
      <div className="w-full max-w-lg space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Todo List</h1>
          <p className="text-muted-foreground text-sm">
            Keep track of what needs to get done.
          </p>
        </div>

        <TodoForm
          register={register}
          handleSubmit={handleSubmit}
          errors={errors}
          onSubmit={onSubmit}
          submitting={submitting}
        />

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="size-6" />
          </div>
        ) : (
          <>
            {todos.length > 0 && (
              <TodoStats
                activeCount={activeTodos.length}
                completedCount={completedTodos.length}
              />
            )}

            {activeTodos.length > 0 && (
              <TodoListCard
                title="Tasks"
                todos={activeTodos}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
              />
            )}

            {completedTodos.length > 0 && (
              <TodoListCard
                title="Completed"
                description={`${completedTodos.length} ${completedTodos.length === 1 ? "task" : "tasks"} completed`}
                todos={completedTodos}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
              />
            )}

            {todos.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No tasks yet. Add one above to get started.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
