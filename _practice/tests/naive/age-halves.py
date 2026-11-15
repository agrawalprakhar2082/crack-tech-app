# Naive approach (too slow on purpose): used by verify.js --speed.
import bisect
def skill_gaps(ages,skills):
    arr=[];out=[]
    for i,(a,s) in enumerate(zip(ages,skills)):
        bisect.insort(arr,(a,i,s))
        h=(len(arr)+1)//2
        out.append(abs(sum(x[2] for x in arr[:h])-sum(x[2] for x in arr[h:])))
    return out
