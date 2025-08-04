"use client"
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, User, Wallet, Clock, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/utils/main-utils';

const StudentLookupPageComponent = () => {
  const [searchCin, setSearchCin] = useState('');
  const [studentData, setStudentData] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  // tRPC mutation for student lookup
  const lookupStudentMutation = trpc.payment.lookupStudent.useMutation();

  const handleSearch = async () => {
    if (!searchCin.trim()) {
      toast.error('Please enter a CIN to search');
      return;
    }

    if (searchCin.length < 5) {
      toast.error('CIN must be at least 5 characters');
      return;
    }

    setIsSearching(true);

    try {
      const result = await lookupStudentMutation.mutateAsync({ cin: searchCin });
      setStudentData(result);
      toast.success('Student found successfully');
    } catch (error) {
      setStudentData(null);
      if (error instanceof Error && error.message.includes('NOT_FOUND')) {
        toast.error('Student not found with this CIN');
      } else {
        toast.error('Failed to lookup student');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchCin('');
    setStudentData(null);
  };

  return (
    <div className="flex flex-col space-y-6 px-6 py-6">

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Search Student</span>
          </CardTitle>
          <CardDescription>
            Enter the student's CIN to view their account details and balance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="search-cin">Student CIN</Label>
              <Input
                id="search-cin"
                placeholder="Enter student CIN (e.g., 12345678)"
                value={searchCin}
                onChange={(e) => setSearchCin(e.target.value)}
                onKeyUp={handleKeyPress}
                className="font-mono text-lg"
                maxLength={24}
              />
            </div>
            <div className="flex items-end space-x-2">
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchCin.trim()}
                className="h-12 px-8"
              >
                {isSearching ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Search
              </Button>
              <Button
                onClick={clearSearch}
                variant="outline"
                className="h-12"
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Information Section */}
      {studentData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Student Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Status Banner */}
                <div className={`flex items-center justify-between p-4 rounded-lg ${
                  studentData.isActive 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    {studentData.isActive ? (
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    ) : (
                      <AlertCircle className="h-8 w-8 text-red-600" />
                    )}
                    <div>
                      <div className={`font-bold text-lg ${
                        studentData.isActive ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {studentData.firstName} {studentData.lastName}
                      </div>
                      <div className={`text-sm font-mono ${
                        studentData.isActive ? 'text-green-700' : 'text-red-700'
                      }`}>
                        CIN: {studentData.cin}
                      </div>
                    </div>
                  </div>
                  <Badge variant={studentData.isActive ? "default" : "destructive"} className="text-sm">
                    {studentData.isActive ? 'Active Account' : 'Inactive Account'}
                  </Badge>
                </div>

                {/* Account Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email Address</label>
                      <div className="text-lg font-mono">{studentData.email}</div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Student ID</label>
                      <div className="text-lg font-mono">{studentData.id}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Last Login</label>
                      <div className="text-lg flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{formatDate(studentData.lastLogin)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex space-x-3 pt-4 border-t">
                  <Button
                    onClick={() => {
                      // Navigate to create deposit with pre-filled CIN
                      window.location.href = `/dashboard/payment/scanner?cin=${studentData.cin}`;
                    }}
                    className="flex items-center space-x-2"
                  >
                    <Wallet className="h-4 w-4" />
                    <span>Add Deposit</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Copy CIN to clipboard
                      navigator.clipboard.writeText(studentData.cin);
                      toast.success('CIN copied to clipboard');
                    }}
                  >
                    Copy CIN
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Balance Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wallet className="h-5 w-5" />
                <span>Account Balance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Current Balance */}
                <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
                  <div className="text-sm font-medium text-gray-600 mb-2">Current Balance</div>
                  <div className="text-4xl font-bold text-blue-600">
                    {formatCurrency(studentData.balance)}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Available for meal purchases
                  </div>
                </div>

                {/* Balance Status */}
                <div className="space-y-2">
                  {studentData.balance > 5000 ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Good balance - can purchase meals</span>
                    </div>
                  ) : studentData.balance > 1000 ? (
                    <div className="flex items-center space-x-2 text-yellow-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Low balance - consider adding funds</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Very low balance - needs deposit</span>
                    </div>
                  )}
                </div>

                {/* Meal Capacity */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700">Meal Capacity</div>
                  <div className="text-lg font-bold">
                    ~{Math.floor(studentData.balance / 200)} meals
                  </div>
                  <div className="text-xs text-gray-500">
                    Based on average meal cost of 200 millimes
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No Results State */}
      {!studentData && searchCin && !isSearching && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Student Not Found</h3>
              <p className="text-sm mb-6">
                No student found with CIN: <span className="font-mono font-bold">{searchCin}</span>
              </p>
              <div className="space-y-2 text-sm">
                <p>Please check:</p>
                <ul className="list-disc list-inside space-y-1 text-left max-w-md mx-auto">
                  <li>CIN is entered correctly</li>
                  <li>Student is registered in the system</li>
                  <li>No extra spaces or characters</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Initial State */}
      {!studentData && !searchCin && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Search for a Student</h3>
              <p className="text-sm mb-6">
                Enter a student's CIN in the search box above to view their account information
              </p>
              <div className="space-y-2 text-sm">
                <p className="font-medium">You can:</p>
                <ul className="list-disc list-inside space-y-1 text-left max-w-md mx-auto">
                  <li>View current account balance</li>
                  <li>Check account status (active/inactive)</li>
                  <li>Access quick deposit options</li>
                  <li>View last login information</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Export with role-based access control
export default StudentLookupPageComponent;