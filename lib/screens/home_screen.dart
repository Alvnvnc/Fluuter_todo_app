import 'package:flutter/material.dart';
import '../db/db_helper.dart';
import '../models/task.dart';
import '../widgets/task_tile.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final DBHelper dbHelper = DBHelper();
  final TextEditingController controller = TextEditingController();

  Future<void> _showTaskDialog({Task? task}) async {
    if (task != null) {
      controller.text = task.title;
    } else {
      controller.clear();
    }

    await showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(task == null ? 'Add Task' : 'Edit Task'),
        content: TextField(
          controller: controller,
          decoration: InputDecoration(hintText: 'Enter task title'),
        ),
        actions: [
          TextButton(
            onPressed: () async {
              if (controller.text.isNotEmpty) {
                final newTask = Task(
                  id: task?.id,
                  title: controller.text,
                );
                if (task == null) {
                  await dbHelper.insertTask(newTask);
                } else {
                  await dbHelper.updateTask(newTask);
                }
                setState(() {});
                Navigator.pop(context);
              }
            },
            child: Text('Save'),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteTask(int id) async {
    await dbHelper.deleteTask(id);
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('To-Do List')),
      body: FutureBuilder<List<Task>>(
        future: dbHelper.getTasks(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(child: CircularProgressIndicator());
          }

          final tasks = snapshot.data ?? [];

          return ListView.builder(
            itemCount: tasks.length,
            itemBuilder: (_, index) {
              final task = tasks[index];
              return TaskTile(
                task: task,
                onEdit: () => _showTaskDialog(task: task),
                onDelete: () => _deleteTask(task.id!),
              );
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showTaskDialog(),
        child: Icon(Icons.add),
      ),
    );
  }
}
