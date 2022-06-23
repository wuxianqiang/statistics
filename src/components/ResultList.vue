<script setup lang="ts">
import { computed } from '@vue/reactivity';
import { ElTable, ElTableColumn, ElAlert, ElUpload, ElButton, ElMessage, ElIcon, ElTabs, ElTabPane, ElDialog, ElCard, ElTimeline, ElTimelineItem, ElCalendar } from 'element-plus'
import type { UploadInstance, UploadProps, UploadRawFile, UploadFile, TabsPaneContext } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { genFileId } from 'element-plus'
import { reactive, ref, nextTick } from 'vue';
import * as XLSX from 'xlsx'
import { putWorkbook } from '../common/js/utils'
import { download } from '../common/js/down'

type Val = string | number

type State = {
  list: any[],
  keys: any[],
  isUpload: boolean,
  // down: any,
  activeName: string,
  statistics: any[],
  userInfo: any,
  dialogVisible: boolean,
  range: Date[]
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
  range: [new Date(2019, 2, 4), new Date(2019, 2, 24)]
})

let downloadList: any = []

const upload = ref<UploadInstance>()

const handleExceed: UploadProps['onExceed'] = (files) => {
  upload.value?.clearFiles()
  const file = files[0] as UploadRawFile
  file.uid = genFileId()
  upload.value?.handleStart(file)
}

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
    const result = putWorkbook(table)
    console.log(result)
    state.keys = result.keys
    state.list = result.result
    downloadList = result.down
    // state.down = result.down
    state.statistics = result.statistics
    nextTick(() => {
      ElMessage({
        message: '计算完成',
        type: 'success',
      })
    })
  } catch (error) {
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
  console.log(result)
  state.list = result.result
  state.keys = result.keys
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
  state.userInfo = state.list[index]
  console.log(state.userInfo)
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
          <el-table :data="state.statistics" stripe style="width: 100%">
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
          width="60%"
        >
            <el-card class="box-card">
              <template #header>
                <div class="card-header">
                  <span>{{state.userInfo['name'].s}}</span>
                  <!-- <el-button class="button" text>Operation button</el-button> -->
                </div>
              </template>
              <div style="height: 400px; overflow: auto;">
                <el-timeline>
                  <el-timeline-item v-for="(item, index) in state.keys.slice(6)" :key="index">
                    <el-card>
                      <h4>{{item.label}}</h4>
                      <p>{{state.userInfo[item.name].o}}</p>
                      <p>{{state.userInfo[item.name].s}}</p>
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
            </el-card>
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
          <el-table :data="state.list" stripe style="width: 100%">
            <el-table-column v-for="item in state.keys" :key="item.name" :prop="item.name" :label="item.label" width="220">
              <template #default="scope">
                <div style="display: flex; align-items: center">
                  <span :class="{ active: scope.row[item.name].l }" :title="scope.row[item.name].o" style="white-space: pre-line;">{{ scope.row[item.name].s }}</span>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <!-- 起1，结0 -->
        <!-- 0则表示星期日，若是1则表示星期一 -->
        <el-tab-pane label="报表看板" name="last">
          <el-calendar :range="[new Date(2019, 2, 4), new Date(2019, 2, 24)]"></el-calendar>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style scoped>
.el-alert {
  margin: 20px 0 0;
}
.el-alert:first-child {
  margin: 0;
}
.active {
  color: red;
}
</style>
