<template>
  <el-timeline style="max-width: 600px">
    <el-timeline-item
      v-for="(activity, index) in activities"
      :key="index"
      :timestamp="activity.timestamp"
      color="green"
    >
        <div v-if="!activity.children"class="content">{{activity.content}}</div>
       <el-collapse v-else v-model="activeNames" @change="handleChange">
          <el-collapse-item :title="activity.content" name="index">
          <el-timeline style="max-width: 600px">
        <el-timeline-item
          v-for="(cactivity, jndex) in activity?.children"
          :key="jndex"
          :timestamp="activity.timestamp"
        >
          {{ cactivity.content }}


          <el-timeline v-if="cactivity.type == 'condition'" style="max-width: 600px">
        <el-timeline-item
          v-for="(tactivity, jndex) in cactivity?.conditionTrue"
          :key="jndex"
          :timestamp="activity.timestamp"
        >
      {{ tactivity.content }}
    </el-timeline-item>
  </el-timeline>


    </el-timeline-item>
  </el-timeline>

        </el-collapse-item>
    </el-collapse>


    </el-timeline-item>
  </el-timeline>
</template>

<script lang="ts" setup>

const activities = [
  {
    content: 'Запуск сценария',
    timestamp: '2018-04-15',
    children: [
      {
        content: 'Http-запрос',
        timestamp: '2018-04-13',
      },
      {
        content: 'Таймер',
        timestamp: '2018-04-11',
      },
      {
        content: 'Если',
        timestamp: '2018-04-11',
        type: 'condition',
        children: [
          {
            content: 'Найти запсь',
            timestamp: '2018-04-11',
          },
          {
            content: 'Создать пользователя',
            timestamp: '2018-04-11',
          },
        ],
      },
      {
        content: 'Иначе',
        timestamp: '2018-04-11',
        children: [
          {
            content: 'Найти запсь',
            timestamp: '2018-04-11',
          },
          {
            content: 'Создать запись',
            timestamp: '2018-04-11',
          },
        ],
      },
    ],
  },
  {
    content: 'Approved',
    timestamp: '2018-04-13',
  },
  {
    content: 'Success',
    timestamp: '2018-04-11',
  },
]


import { ref } from 'vue'
import type { CollapseModelValue } from 'element-plus'

const activeNames = ref(['1'])
const handleChange = (val: CollapseModelValue) => {
  console.log(val)
}


</script>

