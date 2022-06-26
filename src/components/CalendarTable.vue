<script setup lang="ts">
import { computed, ref } from '@vue/reactivity';
import { weekList } from '@/common/js/calendar'
import type { TimeInfo } from '@/common/dataType'
import { ElMessage } from 'element-plus';

type Props = {
  time: any,
}

const props = defineProps<Props>()
const currentIndex = ref(1)

const list = computed(() => {
  return props.time || []
})

const emit = defineEmits(['submit'])

const handleClick = (item: TimeInfo) => {
  if (item.current) {
    currentIndex.value = item.d
    emit('submit', { index: item.d })
  } else {
    ElMessage({
      message: '仅可查看当前月份',
      type: 'warning'
    })
  }
}
</script>

<template>
  <div>
    <ul class="row">
      <li class="item" v-for="(item, index) in weekList" :key="index">
        {{item}}
      </li>
    </ul>
    <ul
      class="row" v-for="(item, index) in list"
      :key="index">
      <li
        class="item"
        v-for="(current, index) in item"
        :key="index"
        @click="handleClick(current)"
        :class="{
          light: current.desc === '休',
          dark: current.desc === '班',
          pink: index > 4,
          black: current.dark,
          active: currentIndex === current.d && !current.dark
        }">
        <div>
          {{current.d || ''}}
        </div>
        <div class="desc">
          {{current.desc}}
        </div>
        <div class="festival">
          {{current.festival}}
        </div>
        <div class="lazy" v-if="current.total">
          迟到 {{current.total.totalLazy}} 人
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
ul {
  list-style: none;
}
.el-alert {
  margin: 20px 0 0;
}
.el-alert:first-child {
  margin: 0;
}

.row {
  display: flex;
  flex-direction: row;
  line-height: 22px;
  font-size: 18px;
}

.item {
  display: flex;
  position: relative;
  justify-content: center;
  align-content: center;
  align-items: center;
  flex-direction: column;
  border-radius: 6px;
  cursor: pointer;
  width: 70px;
  height: 66px;
  padding: 4px 2px 2px 2px;
  box-sizing: border-box;
  border: 1px solid transparent;
  overflow: hidden;
  line-height: 1;
  zoom: 1;
  margin: 2px;
}

.title {
  margin-top: 24px;
  margin-bottom: 6px;
}

.desc {
  font-size: 12px;
  position: absolute;
  left: 4px;
  top: 4px;
  color: #F73131;
  font-size: 12px;
  line-height: 12px;
}
.festival {
  font-size: 12px;
}
.light {
  background: #FDE3E4;
  color: #F73131;
}
.dark {
  background: #f5f5f6;
}

.pink {
  color: #F73131;
}

.dark .desc {
  color: #626675;
}

.dark.pink {
  color: #000;
}

.item:hover {
  border: 1px solid;
}

.black {
  opacity: 0.5;
}

.lazy {
  margin-top: 3px;
  font-size: 10px;
  transform: scale(0.8);
}

.active {
  border: 1px solid;
}
</style>
