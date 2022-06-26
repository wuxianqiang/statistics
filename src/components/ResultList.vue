<script setup lang="ts">
import { computed } from '@vue/reactivity';
import { ElTable, ElTableColumn, ElAlert, ElUpload, ElButton, ElMessage, ElIcon, ElTabs, ElTabPane, ElDialog, ElCard, ElTimeline, ElTimelineItem, ElTag } from 'element-plus'
import type { UploadInstance, UploadProps, UploadRawFile, UploadFile } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { genFileId } from 'element-plus'
import { reactive, ref, nextTick, watch } from 'vue';
import * as XLSX from 'xlsx'
import { putWorkbook } from '../common/js/utils'
import { download } from '../common/js/down'
import CalendarTable from './CalendarTable.vue';
import type { Time } from '@/common/dataType'
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()

type State = {
  list: any[],
  keys: any[],
  isUpload: boolean,
  // down: any,
  activeName: string,
  statistics: any[],
  userInfo: any,
  dialogVisible: boolean,
  range: Date[],
  time: Time,
  table: string,
  result: any,
  currentDay: any,
  currentName: any
}

const state = reactive<State>({
  list: [],
  keys: [],
  isUpload: false,
  // down: [] as any,
  activeName: 'first',
  statistics: [],
  userInfo: {},
  dialogVisible: false,
  range: [new Date(2019, 2, 4), new Date(2019, 2, 24)],
  time: {
    s: '',
    y: 0,
    m: 0,
    d: 0
  },
  currentDay: [],
  table: '',
  currentName: [],
  result: {
    nameList: [],
    dataList: [],
    title: [],
    time: {}
  }
})

let downloadList: any = []

const upload = ref<UploadInstance>()

const handleExceed: UploadProps['onExceed'] = (files) => {
  upload.value?.clearFiles()
  const file = files[0] as UploadRawFile
  file.uid = genFileId()
  upload.value?.handleStart(file)
}

watch(() => {
  return counter.counter
}, () => {
  state.isUpload = false
})

const handleUpload = async (uploadFile: UploadFile) => {
  const file = uploadFile.raw
  if (!file) return
  state.isUpload = true
  ElMessage({
    message: '上传成功，正在计算',
    type: 'success',
  })
  try {
    const table = await readWorkbookFromLocalFile(file)
    const result: any = putWorkbook(table)
    // console.log(result)
    // state.keys = result.keys
    // state.list = result.result
    // state.time = result.time
    // state.table = result.table
    downloadList = result.dataList.down
    // state.down = result.down
    // state.statistics = result.statistics
    console.log(result)
    state.result = result
    state.currentName = result.dataList.column[0]
    state.currentDay = result.dataList.column[6]
    counter.setTitle(result.title)
    nextTick(() => {
      ElMessage({
        message: '计算完成',
        type: 'success',
      })
    })
  } catch (error) {
    console.log(error)
    ElMessage({
      message: '上传失败，重新上传',
      type: 'error',
    })
  }
}

function readWorkbookFromLocalFile(file: File) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function (e: any) {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      resolve(workbook)
    };
    reader.readAsBinaryString(file);
  })
}

const handleChange = async (e: any) => {
  const file: File = e.target.files[0]
  const table = await readWorkbookFromLocalFile(file)
  const result = putWorkbook(table)
  // console.log(result)
  // state.list = result.result
  // state.keys = result.keys
}

const totalList = computed(() => {
  const count = state.list.length
  const title = count > 0 ? `总共 ${state.list.length} 条数据` : '暂无数据'
  return title
})

const handleDown = () => {
  if (downloadList.length) {
    download(downloadList)
  } else {
    ElMessage({
      message: '请先上传文件',
      type: 'error',
    })
  }
}

const handleRefresh = () => {
  state.isUpload = false
}

const handleEdit = (index: number) => {
  state.userInfo = state.result.dataList.row[index]
  // console.log(state.userInfo)
  state.dialogVisible = true
}

const options = [
  {
    value: 'Option1',
    label: '正常',
  },
  {
    value: 'Option2',
    label: '迟到',
  }
]

const handleSubmit = (p: { index: number }) => {
  const column = state.result.dataList.column || []
  state.currentDay = column[p.index + 5]
}

</script>

<template>
  <div>
    <div v-if="!state.isUpload">
      <el-upload
        ref="upload"
        class="upload-demo"
        :limit="1"
        :on-exceed="handleExceed"
        :on-change="handleUpload"
        :auto-upload="false"
        drag
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖拽到此处 或者 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            xlsx files with a size less than 500kb
          </div>
        </template>
      </el-upload>
    </div>

    <div v-else>
      
      <!-- <el-button type="primary" @click="handleRefresh">重新上传</el-button> -->
      <el-tabs v-model="state.activeName" class="demo-tabs">
        <el-tab-pane label="统计看板" name="first">
          <el-button type="primary" @click="handleDown">点击下载</el-button>
          <el-table :data="state.result.dataList.total" stripe style="width: 100%">
            <el-table-column prop="username" label="姓名" />
            <el-table-column prop="totalWork" sortable label="正班时间" />
            <el-table-column prop="totalWorkAdd" sortable label="工作日加班时间" />
            <el-table-column prop="totalWeekAdd" sortable label="双休日加班时间" />
            <el-table-column prop="totalLazy" sortable label="迟到时间" />
            <el-table-column label="操作">
              <template #default="scope">
                <el-button size="small" @click="handleEdit(scope.$index)"
                  >查看详情</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-dialog
          v-model="state.dialogVisible"
          title="考勤详情"
          width="700px"
        >
          <template #header>
            <div class="card-header">
              <span>考勤详情</span>
              <!-- <span>{{state.userInfo['name'].s}}</span> -->
              <!-- <el-button class="button" text>Operation button</el-button> -->
            </div>
          </template>
          <div style="height: 400px; overflow: auto; padding: 12px 0;">
            <el-timeline>
              <el-timeline-item v-for="(item, index) in state.result.nameList" :key="index" placement="top">
                <!-- <h4>{{item.label}}</h4> -->
                <!-- <p>{{state.userInfo[index].__origin}}</p> -->
                <!-- <p>{{state.userInfo[index].__origin}}</p> -->
                <el-card class="box-card">
                  <template #header>
                    <div class="card-header">
                      <span>{{item.label}}</span>
                      <!-- <el-button class="button" text>Operation button</el-button> -->
                      <div>
                        <el-tag v-if="state.userInfo[index].work && state.userInfo[index].work.s && state.userInfo[index].work.l" class="ml-2" type="danger">
                          迟到
                        </el-tag>
                        <el-tag v-if="state.userInfo[index].work && !state.userInfo[index].work.s && state.userInfo[index].work.o" type="warning">
                          人工审核
                        </el-tag>
                        <el-tag v-if="state.userInfo[index].work && state.userInfo[index].work.s && !state.userInfo[index].work.l" class="ml-2" type="success">
                          正常
                        </el-tag>
                      </div>
                    </div>
                  </template>
                  <div>
                    <!-- <span>{{state.currentName[index].__origin}}：</span> -->
                    <span>
                      {{state.userInfo[index].__origin}}
                    </span>
                    <p :class="{red: state.userInfo[index].work.l}" v-if="state.userInfo[index].work">
                      {{state.userInfo[index].work.s}}
                    </p>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
            <!-- <ul style="white-space: nowrap;">
              <li style="display: inline-block; width: 200px;" v-for="(item, index) in state.userInfo" :key="index">
                <div>{{item.s}}</div>
                <div>{{item.o}}</div>
              </li>
            </ul> -->
          </div>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="state.dialogVisible = false">Cancel</el-button>
              <el-button type="primary" @click="state.dialogVisible = false"
                >Confirm</el-button
              >
            </span>
          </template>
        </el-dialog>
        <el-tab-pane label="数据看板" name="second">
          <el-alert :title="totalList" type="warning" :show-icon="true" :closable="false" />
          <!-- <el-table :data="state.list" stripe style="width: 100%">
            <el-table-column v-for="item in state.keys" :key="item.name" :prop="item.name" :label="item.label" width="220">
              <template #default="scope">
                <div style="display: flex; align-items: center">
                  <span :class="{ active: scope.row[item.name].l }" :title="scope.row[item.name].o" style="white-space: pre-line;">{{ scope.row[item.name].s }}</span>
                </div>
              </template>
            </el-table-column>
          </el-table> -->
          <div class="wrap">
            <table class="table" cellpadding="10">
              <thead class="thead">
                <tr class="tr">
                  <th class="th" v-for="(item, index) in state.result.nameList" :key="index">
                    {{item.label}}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr class="tr" v-for="(row, index) in state.result.dataList.row" :key="index">
                  <td class="td" v-for="(col, index) in row" :key="index" :class="{red: col.work && col.work.l}">
                    {{col.__origin}}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- <div v-html="state.table"></div> -->
        </el-tab-pane>
        <!-- 起1，结0 -->
        <!-- 0则表示星期日，若是1则表示星期一 -->
        <el-tab-pane label="报表看板" name="last">
          <div class="calendar">
            <calendar-table @submit="handleSubmit" :time="state.result.time.timeWeek"></calendar-table>
            <!-- <el-calendar :range="[new Date(2019, 2, 4), new Date(2019, 2, 24)]"></el-calendar> -->
            <ul class="list">
              <li class="item" v-for="(item, index) in state.currentDay" :key="index">
                <el-card class="box-card">
                  <template #header>
                    <div class="card-header">
                      <span>上班情况</span>
                      <!-- <el-button class="button" text>Operation button</el-button> -->
                      <div>
                        <el-tag v-if="item.work && item.work.s && item.work.l" class="ml-2" type="danger">
                          迟到
                        </el-tag>
                        <el-tag v-if="item.work && !item.work.s && item.work.o" type="warning">
                          人工审核
                        </el-tag>
                         <el-tag v-if="item.work && item.work.s && !item.work.l" class="ml-2" type="success">
                          正常
                        </el-tag>
                      </div>
                    </div>
                  </template>
                  <div>
                    <span>{{state.currentName[index].__origin}}：</span>
                    <span>
                      {{item.__origin}}
                    </span>
                    <p :class="{red: item.work.l}" v-if="item.work">
                      {{item.work.s}}
                    </p>
                  </div>
                </el-card>
              </li>
            </ul>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style scoped>
.list {
  list-style: none;
  line-height: 36px;
  overflow: auto;
  max-height: 600px;
  padding: 20px;
  margin-left: 60px;
  min-width: 600px;
}
.el-alert {
  margin: 20px 0 0;
}
.el-alert:first-child {
  margin: 0;
}
.active {
  color: red;
}

.td {
  border-bottom: 1px solid #dcdfe6;
  border-right: 1px solid #dcdfe6;
}
.th {
  border-bottom: 1px solid #dcdfe6;
  border-right: 1px solid #dcdfe6;
  border-top: 1px solid #dcdfe6;
  background: #f5f7fa;
  position: sticky;
  top: 0;
  z-index: 3;
  background: #f5f7fa;
}

.th:first-child {
  border-left: 1px solid #dcdfe6;
  top: 0;
  left: 0;
  z-index: 4;
  background: #f5f7fa;
}

.td:first-child {
  position: sticky;
  left: 0;
  z-index: 2;
  background: #f5f7fa;
  border-left: 1px solid #dcdfe6;
}

.table {
  border-spacing: 0;
  overflow: auto;
  table-layout: fixed;
  border-collapse: separate;
  white-space: nowrap;
  text-align: left;
}
.wrap {
  margin-top: 20px;
  width: 100%;
  overflow: auto;
  max-height: 600px;
}
.tr:hover {
  background: #ecf5ff;
}

.calendar {
  display: flex;
}

.red {
  color: #F73131;
}

.item {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
