<template>
  <el-config-provider namespace="ep">
    <div class="main-container flex">
      <el-container class="main-aside-wrp">

        <el-aside width="390px">
          <BaseSide />
        </el-aside>

        <el-container>

          <el-header>
            <BaseHeader />
          </el-header>

          <el-container>
            <el-main>
              <div w="full" py="4">
                <RouterView />
              </div>
            </el-main>
            <ExtraSide />
          </el-container>

        </el-container>
      </el-container>
    </div>
  </el-config-provider>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300..900;1,300..900&display=swap');

#app {
  text-align: center;
  font-family: 'PingFang SC', sans-serif;
}

.ep-header {
  padding: 0;
}

.main-container {
  height: 100vh;
}

.ep-aside {
  .ep-container, .main-aside {
    height: 100%;
  }
}
</style>
