extern "C"
{
  long long testF(int a)
  {
    long long result = 0;
    for (int i = 0; i < a; i++)
    {
      result += i;
    }
    return result;
  }
}
