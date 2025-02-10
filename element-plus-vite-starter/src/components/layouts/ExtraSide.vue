<script lang="ts" setup>
import {
  Document,
  Menu as IconMenu,
  Location,
  Setting,
  Search,
} from '@element-plus/icons-vue'


import { ref } from 'vue'
import type { CollapseModelValue } from 'element-plus'

const activeNames = ref(['1'])
const handleChange = (val: CollapseModelValue) => {
  console.log(val)
}
</script>

<template>
<el-aside class="actions-aside">

  <h4>Добавить действие</h4>

 <el-scrollbar height="700px">
    <div class="demo-collapse">
      <el-collapse v-model="activeNames" @change="handleChange">
        <el-collapse-item title="База данных" name="1">
          <el-button color="#626aef" plain> <MyIconPack name="create-record" /> Создать запись</el-button>
          <el-button color="#626aef" plain> <MyIconPack name="update-record" /> Обновить записи</el-button>
          <el-button color="#626aef" plain> <MyIconPack name="find-record" /> Найти запись</el-button>
          <el-button color="#626aef" plain> <MyIconPack name="delete-record" /> Удалить запись</el-button>
        </el-collapse-item>
        <el-collapse-item title="Условия и действия" name="2">
          <el-button color="#626aef" plain> <MyIconPack name="condition" /> Если</el-button>
          <el-button color="#626aef" plain> <MyIconPack name="condition" /> Иначе</el-button>
          <el-button color="#626aef" plain> <MyIconPack name="web" /> HTTP-запрос</el-button>
          <el-button color="#626aef" plain> <MyIconPack name="timer" /> Таймер</el-button>
          <el-button color="#626aef" plain> <MyIconPack name="code" /> Выполнить код</el-button>
        </el-collapse-item>
        <el-collapse-item title="Пользователи" name="3">
          <el-button color="#626aef" plain> <MyIconPack name="user-add" /> Создать пользователя</el-button>
          <el-button color="#626aef" plain> <MyIconPack name="user-update-email" /> Изменить почту</el-button>
          <el-button color="#626aef" plain> <MyIconPack name="user-update-pass" /> Восстановить пароль</el-button>
        </el-collapse-item>
        <el-collapse-item title="Обработка ошибок" name="4">
          <el-button color="#626aef" plain> <MyIconPack name="bug" /> Попробовать</el-button>
          <el-button color="#626aef" plain> <MyIconPack name="bug" /> В случае ошибки</el-button>
        </el-collapse-item>
      </el-collapse>
    </div>

 </el-scrollbar>
</el-aside>
</template>

<style>
.actions-aside {
  border-left: 1px solid var(--ep-border-color);
  padding-top: 20px;
overflow: hidden;

.ep-scrollbar {
  height:calc(100vh -20px);
}

  h4 {
    font-size: 16px;
    line-height: 23px;
    text-align: left;
    margin: 24px 20px 17px;
    font-weight: 500;
  }
}

.demo-collapse .ep-collapse {
  .ep-collapse-item {
    /*padding: 20px;*/
    :first-child {
    }
    &:first-child {
      >button:first-child {
        /*border-top: none;*/
        /*background-color: green;*/
      }
    }
    >button {
      /*padding-left: 20px;*/
padding: 0 5px 0 20px;
      font-size: 14px;
    }
    .ep-collapse-item__content {
      /*background-color: pink;*/
      padding: 0 20px;
      button {
        width: 100%;
        margin-left: 0;
        text-align: left;
        border-radius: 0;
        border: none;
        display: flex;
        justify-content: flex-start;
        padding: 8px;
        height: 48px;
        color: var(--ep-text-color-primary);
        background-color: var(--light-bg);
        margin-bottom: 8px;
        &:last-child {
          margin-bottom: 12px;
        }
        border: 1px solid transparent;
        transition: border-color var(--ep-transition-duration), var(--ep-transition-function-bezier);
        &:hover {
          border-color: var(--ep-color-primary);
        }
      }
    }
  
  }
}
</style>
