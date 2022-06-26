<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { ElHeader, ElMain, ElFooter, ElContainer, ElButton } from 'element-plus'
import MenuList from './components/MenuList.vue';
import { useCounterStore } from '@/stores/counter'

const store = useCounterStore()

const handleClick = () => {
  store.increment()
  store.setTitle('')
}
</script>

<template>
  <div class="common-layout">
    <el-container>
      <el-header>
        <div class="title">
          {{store.title}}
        </div>
        <el-button @click="handleClick">重新上传</el-button>
      </el-header>
      <el-container>
        <el-aside width="240px">
          <menu-list></menu-list>
        </el-aside>
        <el-main>
          <router-view></router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style>
@import '@/assets/base.css';

#app {
  height: 100%;
  margin: 0 auto;

  font-weight: normal;
}

header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

a,
.green {
  text-decoration: none;
  color: hsla(160, 100%, 37%, 1);
  transition: 0.4s;
}

@media (hover: hover) {
  a:hover {
    background-color: hsla(160, 100%, 37%, 0.2);
  }
}

.common-layout, .el-container {
  height: 100%;
}

.el-header {
  display: flex;
  align-items: center;
  color: #fff;
  justify-content: space-between;
}

.el-header, .el-footer {
  background: var(--vt-c-black-mute);
}

nav {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  text-align: center;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

</style>
