/**
 * @file d.cpp
 * @author your name (you@domain.com)
 * @brief 1.业务能力？ 2.工作状态？
 * @version 0.1
 * @date 2023-10-20
 * @copyright Copyright (c) 2023
 */
#include <iostream>
#include <chrono>
// [System.Environment]::SetEnvironmentVariable("EMSDK", "E:\third\myexample\emsdk", [System.EnvironmentVariableTarget]::User)
//[System.Environment]::SetEnvironmentVariable("EMSDK", $null, [System.EnvironmentVariableTarget]::User)
// [System.Environment]::SetEnvironmentVariable("EM_CONFIG", $null, [System.EnvironmentVariableTarget]::User)

// [System.Environment]::SetEnvironmentVariable("EM_CONFIG", "E:\third\myexample\emsdk\upstream\emscripten", [System.EnvironmentVariableTarget]::User)

// $env:EMSDK = "E:\third\myexample\emsdk"
// $env:EM_CONFIG = "E:\third\myexample\emsdk\upstream\emscripten"

void performOperations()
{
  long long result = 0;
  for (int i = 0; i < 5000000; i++)
  {
    result += i;
  }
}

int main()
{
  auto start = std::chrono::high_resolution_clock::now();
  performOperations();
  auto stop = std::chrono::high_resolution_clock::now();
  auto duration = std::chrono::duration_cast<std::chrono::microseconds>(stop - start);
  std::cout << "C++ Execution Time: " << duration.count() << " microseconds" << std::endl;
  return 0;
}
