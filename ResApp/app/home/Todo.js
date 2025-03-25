import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';

export default function Todo() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Simulating database data with more tasks
    const fetchedTasks = [
      { id: 1, text: 'Active Event proposlas to TL', completed: false, expiration: moment().add(2, 'days').format('YYYY-MM-DD') },
      { id: 2, text: 'Duty on the 29th', completed: false, expiration: moment().add(7, 'days').format('YYYY-MM-DD') },
      { id: 3, text: 'Passive Program', completed: true, expiration: moment().add(1, 'months').format('YYYY-MM-DD') },
      { id: 4, text: 'Attend team meeting', completed: false, expiration: moment().add(3, 'days').format('YYYY-MM-DD') },
      { id: 5, text: '1:1s 50%', completed: false, expiration: moment().add(1, 'week').format('YYYY-MM-DD') },
      { id: 6, text: 'Add report to Workday', completed: false, expiration: moment().add(2, 'weeks').format('YYYY-MM-DD') },
    ];
    setTasks(fetchedTasks);
  }, []);

  const addTask = () => {
    if (newTask.trim() !== '') {
      setTasks([...tasks, { id: Date.now(), text: newTask, completed: false, expiration: moment().add(7, 'days').format('YYYY-MM-DD') }]);
      setNewTask('');
    }
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const filteredTasks = tasks
  .filter(task => {
    const taskDate = moment(task.expiration);
    if (filter === 'week') return taskDate.isSame(moment(), 'week');
    if (filter === 'month') return taskDate.isSame(moment(), 'month');
    return true;
  })
  .sort((a, b) => a.completed - b.completed);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>To-Do List</Text>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            onPress={() => setFilter('all')}
            style={[styles.filterButton, filter === 'all' && styles.activeFilter]}>
            <Text style={filter === 'all' ? styles.activeText : styles.inactiveText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter('week')}
            style={[styles.filterButton, filter === 'week' && styles.activeFilter]}>
            <Text style={filter === 'week' ? styles.activeText : styles.inactiveText}>This Week</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter('month')}
            style={[styles.filterButton, filter === 'month' && styles.activeFilter]}>
            <Text style={filter === 'month' ? styles.activeText : styles.inactiveText}>This Month</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={[styles.taskItem, item.completed && styles.completedTask]}>
              <TouchableOpacity onPress={() => toggleTask(item.id)}>
                <Ionicons name={item.completed ? 'checkmark-circle' : 'ellipse-outline'} size={24} color="green" />
              </TouchableOpacity>
              <View style={styles.taskInfo}>
                <Text style={[styles.taskText, item.completed && styles.taskTextCompleted]}>{item.text}</Text>
                <Text style={styles.expirationText}>Expires: {item.expiration}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteTask(item.id)}>
                <Ionicons name="trash-outline" size={24} color="red" />
              </TouchableOpacity>
            </View>
          )}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Add a new task..."
            value={newTask}
            onChangeText={setNewTask}
          />
          <TouchableOpacity onPress={addTask} style={styles.addButton}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8F5E9', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2E7D32', marginBottom: 20 },
  filterContainer: { flexDirection: 'row', justifyContent: 'space-evenly', marginBottom: 10 },
  filterButton: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#A5D6A7', borderRadius: 5 },
  activeFilter: { backgroundColor: '#388E3C' },
  activeText: { color: 'white', fontWeight: 'bold' },
  inactiveText: { color: '#2E7D32' },
  taskItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  completedTask: { opacity: 0.5 },
  taskInfo: { flex: 1, marginLeft: 10 },
  taskText: { fontSize: 16, color: '#2E7D32' },
  taskTextCompleted: { textDecorationLine: 'line-through', color: 'grey' },
  expirationText: { fontSize: 12, color: 'grey', marginTop: 5 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  input: { flex: 1, backgroundColor: 'white', padding: 10, borderRadius: 10, fontSize: 16 },
  addButton: { marginLeft: 10, backgroundColor: '#2E7D32', padding: 10, borderRadius: 50, alignItems: 'center', justifyContent: 'center' }
});
